import { Prisma, Difficulty } from "@prisma/client";
import { prisma } from "../config/db.js";

export interface GetProblemsParams {
    page?: number;
    limit?: number;
    difficulty?: Difficulty;
    search?: string;
}

export class ProblemService {

    async getProblems(params: GetProblemsParams) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;

        const where: Prisma.ProblemWhereInput = {};

        if (params.difficulty) {
            where.difficulty = params.difficulty;
        }

        if (params.search) {
            where.OR = [
                { title: { contains: params.search, mode: "insensitive" } },
                { description: { contains: params.search, mode: "insensitive" } },
            ];
        }

        const [problems, total] = await Promise.all([
            prisma.problem.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    difficulty: true,
                    constraints: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.problem.count({ where }),
        ]);

        return {
            problems,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


    async getProblemBySlug(slug: string) {
        const problem = await prisma.problem.findUnique({
            where: { slug },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                difficulty: true,
                constraints: true,
                starterCode: true,
                publicTestCases: true,
                createdAt: true,
            },
        });

        if (!problem) {
            throw new Error(`Problem with slug "${slug}" not found.`);
        }
        
        return problem;
    }


    async getProblemForExecution(id: string) {
        const problem = await prisma.problem.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                publicTestCases: true,
                hiddenTestCases: true,
            },
        });

        if (!problem) {
            throw new Error(`Problem with ID "${id}" not found.`);
        }

        return problem;
    }


    async getRandomProblem(difficulty?: Difficulty) {
        const where: Prisma.ProblemWhereInput = difficulty ? { difficulty } : {};

        const count = await prisma.problem.count({ where });
        if (count === 0) {
            throw new Error(`No problems found matching criteria.`);
        }

        const randomOffset = Math.floor(Math.random() * count);

        const [problem] = await prisma.problem.findMany({
            where,
            skip: randomOffset,
            take: 1,
            select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                description: true,
                constraints: true,
                starterCode: true,
                publicTestCases: true,
            },
        });

        return problem;
    }
}

export const problemService = new ProblemService();