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

}

