import { prisma } from "../config/db.js";
import { Difficulty, MatchStatus, Prisma } from "@prisma/client";

export const MatchDetailsInclude = Prisma.validator<Prisma.MatchInclude>()({
    player1: {
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            elo: true,
        },
    },
    player2: {
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            elo: true,
        },
    },
    winner: {
        select: {
            id: true,
            username: true,
        }
    },
    problem: {
        select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            description: true,
            constraints: true,
            starterCode: true,
            publicTestCases: true,
        }
    },
});


export type MatchDetails = Prisma.MatchGetPayload<{
    include: typeof MatchDetailsInclude
}>


export interface createMatchInput {
    player1Id: string;
    player2Id: string;
    problemId?: string;
    difficulty?: Difficulty;
}

export interface FinishMatchInput {
    matchId: string;
    winnerId: string | null; 
}


export class MatchService {

    static async createMatch(input: createMatchInput): Promise<MatchDetails> {
        if (input.player1Id === input.player2Id) {
            throw new Error('A player cannot match with themselves');
        }
        
        const players = await prisma.user.findMany({
            where: {id: {in: [input.player1Id, input.player2Id]}},
            select: {id: true, elo: true},
        });
        if (players.length < 2) {
          throw new Error('One or both players could not be found');
        }

        const avgElo = (players[0]!.elo + players[1]!.elo) / 2;
        const targetDifficulty = this.getDifficultyFromElo(avgElo);

        let problems = await prisma.problem.findMany({
            where: {difficulty: targetDifficulty},
            select: {id: true},
        });

        if(problems.length === 0) {
            problems = await prisma.problem.findMany({
                select: {id: true},
            });
        }

        const randomIndex = Math.floor(Math.random()*problems.length);
        input.problemId = problems[randomIndex]!.id;
        const match = await prisma.match.create({
            data: {
                player1Id: input.player1Id,
                player2Id: input.player2Id,
                problemId: input.problemId || null,
                status: MatchStatus.IN_PROGRESS,
            },
            include: MatchDetailsInclude,
        });
        return match;
    }

    static async getMatchById(matchId: string): Promise<MatchDetails> {
        const match = await prisma.match.findUnique({
            where: {id: matchId},
            include: MatchDetailsInclude,
        });

        if (!match) {
            throw new Error('Match not found');
        }

        return match;
    }

    static async finishMatch(input: FinishMatchInput): Promise<MatchDetails> {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch match and players (Read step)
        const match = await tx.match.findUnique({
            where: { id: input.matchId },
            include: {
                player1: true,
                player2: true,
            }
        });

        if (!match) {
            throw new Error('Match not found');
        }

        // 2. Atomic Guard: Update status ONLY if it is currently IN_PROGRESS
        const updateResult = await tx.match.updateMany({
            where: {
                id: input.matchId,
                status: MatchStatus.IN_PROGRESS, // Atomic condition check
            },
            data: {
                status: MatchStatus.FINISHED,
                winnerId: input.winnerId,
                endedAt: new Date(),
            }
        });

        // If count === 0, another request already finished this match!
        if (updateResult.count === 0) {
            throw new Error('Match is not in progress or has already ended');
        }

        // 3. Compute ELO & Stat Logic
        const p1Elo = match.player1.elo;
        const p2Elo = match.player2.elo;

        const isP1Winner = input.winnerId === match.player1Id;
        const isP2Winner = input.winnerId === match.player2Id;
        const isDraw = input.winnerId === null;

        const winnerNumeric = isP1Winner ? 1 : isP2Winner ? 2 : 0;
        const { p1EloChange, p2EloChange } = this.calculateEloChange(p1Elo, p2Elo, winnerNumeric);

        // 4. Record ELO changes on the match record
        await tx.match.update({
            where: { id: input.matchId },
            data: {
                p1EloChange,
                p2EloChange,
            }
        });

        // 5. Update Player 1 Stats (Draws do not count as losses)
        await tx.user.update({
            where: { id: match.player1Id },
            data: {
                elo: { increment: p1EloChange },
                wins: { increment: isP1Winner ? 1 : 0 },
                losses: { increment: !isP1Winner && !isDraw ? 1 : 0 },
            }
        });

        // 6. Update Player 2 Stats
        await tx.user.update({
            where: { id: match.player2Id },
            data: {
                elo: { increment: p2EloChange },
                wins: { increment: isP2Winner ? 1 : 0 },
                losses: { increment: !isP2Winner && !isDraw ? 1 : 0 },
            }
        });

        // 7. Return complete match details
        return await tx.match.findUniqueOrThrow({
            where: { id: input.matchId },
            include: MatchDetailsInclude,
        });
    });
}

    static async getMatchesForUser(userId: string): Promise<MatchDetails[]> {
        const matches = await prisma.match.findMany({
            where: {
                OR: [
                    { player1Id: userId },
                    { player2Id: userId },
                ],
            },
            include: MatchDetailsInclude,
        });
        if(matches.length === 0) {
            throw new Error('No matches found for this user');
        }

        return matches;
    }

    private static calculateEloChange(p1Elo: number, p2Elo: number, winner: number): {p1EloChange: number, p2EloChange: number} {
        const kFactor = 32;
        const expectedScoreP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
        const exprectedScoreP2 = 1 - expectedScoreP1;
        if(winner === 1) {
            const p1EloChange = Math.round(kFactor * (1 - expectedScoreP1));
            const p2EloChange = Math.round(kFactor * (0 - exprectedScoreP2));
            return {p1EloChange, p2EloChange};
        }else if(winner === 2) {
            const p1EloChange = Math.round(kFactor * (0 - expectedScoreP1));
            const p2EloChange = Math.round(kFactor * (1 - exprectedScoreP2));
            return {p1EloChange, p2EloChange};
        }

        const p1EloChange = Math.round(kFactor * (0.5 - expectedScoreP1));
        const p2EloChange = Math.round(kFactor * (0.5 - exprectedScoreP2));
        return {p1EloChange, p2EloChange};

    }


    private static getDifficultyFromElo(avgElo: number): Difficulty {
        if(avgElo < 1000) return Difficulty.EASY;
        if(avgElo < 1500) return Difficulty.MEDIUM;
        return Difficulty.HARD;
    }

}