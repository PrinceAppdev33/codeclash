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
        const match = await prisma.match.findUnique({
            where: {id: input.matchId},
            include: {
                player1: true,
                player2: true,
            }
        });

        if(!match) {
            throw new Error('Match not found');
        }

        if(match.status !== MatchStatus.IN_PROGRESS) {
            throw new Error('Match is not in progress');
        }

        const p1Elo = match.player1.elo;
        const p2Elo = match.player2.elo;

        const { p1EloChange, p2EloChange } = this.calculateEloChange(p1Elo, p2Elo, input.winnerId === match.player1Id? 1 : input.winnerId === match.player2Id? 2 : 0);

        const isP1Winner = input.winnerId === match.player1Id;
        const isP2Winner = input.winnerId === match.player2Id;

        const [updatedMatch] = await prisma.$transaction([
            prisma.match.update({
                where: {id: input.matchId},
                data: {
                    status: MatchStatus.FINISHED,
                    winnerId: input.winnerId,
                    p1EloChange: p1EloChange,
                    p2EloChange: p2EloChange,
                    endedAt: new Date(),
                },
                include: MatchDetailsInclude,
            }),

            prisma.user.update({
                where: {id: match.player1Id},
                data: {
                    elo: {increment: p1EloChange},
                    wins: {increment: isP1Winner? 1 : 0},
                    losses: {increment: isP1Winner? 0 : 1},
                }
            }),

            prisma.user.update({
                where: {id: match.player2Id},
                data: {
                    elo: {increment: p2EloChange},
                    wins: {increment: isP2Winner? 1 : 0},
                    losses: {increment: isP2Winner? 0 : 1},
                }
            }),
        ]);

        return updatedMatch;
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

