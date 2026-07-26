import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/config/db.js";

type ContestTestCase = {
    input: unknown;
    output: unknown;
    solution?: unknown;
};

type ContestProblem = {
    id?: string;
    name?: string;
    description?: string;
    difficulty?: number | null;
    constraints?: string;
    publicTestCases?: Array<{ input?: unknown; output?: unknown; solution?: unknown }>;
    hiddenTestCases?: Array<{ input?: unknown; output?: unknown; solution?: unknown }>;
    [key: string]: unknown;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const seedFilePath = path.join(__dirname, "../script/data.json");

const difficultyMap = (difficulty?: number | null) => {
    if (difficulty === undefined || difficulty === null) return "EASY" as const;
    if (difficulty <= 1200) return "EASY" as const;
    if (difficulty <= 1800) return "MEDIUM" as const;
    return "HARD" as const;
};

const slugify = (value: string, uniqueSuffix: string | number) => {
    const baseSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return baseSlug ? `${baseSlug}-${uniqueSuffix}` : `problem-${uniqueSuffix}`;
};

const normalizeTestCases = (value: unknown): ContestTestCase[] => {
    if (!Array.isArray(value)) return [];

    return value.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const record = entry as Record<string, unknown>;

        if (record.input !== undefined && record.output !== undefined) {
            return [{
                input: record.input,
                output: record.output,
                solution: record.solution,
            }];
        }
        return [];
    });
};

const buildStarterCode = () => ({
    javascript: "function solve(input) {\n  // Write your solution here\n}\n",
    typescript: "function solve(input: string): string {\n  // Write your solution here\n  return \"\";\n}\n",
    python: "def solve(input_data: str) -> str:\n    # Write your solution here\n    return \"\"\n",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n    return 0;\n}\n",
    java: "import java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        // Write your solution here\n    }\n}\n",
});

const asJsonValue = (value: unknown) => value as Prisma.InputJsonValue;

const seedData = async () => {
    if (!fs.existsSync(seedFilePath)) {
        throw new Error(`Seed file not found at ${seedFilePath}. Run download.py first.`);
    }

    const rawData = fs.readFileSync(seedFilePath, "utf-8");
    const data = JSON.parse(rawData) as ContestProblem[];

    if (!Array.isArray(data)) {
        throw new Error("Expected data.json to contain an array of problems.");
    }

    console.log("Clearing existing submissions, matches, and problems...");
    await prisma.submission.deleteMany();
    await prisma.match.deleteMany();
    await prisma.problem.deleteMany();

    let createdCount = 0;

    for (const [index, item] of data.entries()) {
        const publicTestCases = normalizeTestCases(item.publicTestCases);
        const hiddenTestCases = normalizeTestCases(item.hiddenTestCases);

        const title = item.name?.toString().trim() || `Problem ${index + 1}`;
        const uniqueId = item.id || (index + 1).toString();
        const slug = slugify(title, uniqueId);

        await prisma.problem.upsert({
            where: { slug },
            update: {
                title,
                description: item.description?.toString().trim() || "No description provided.",
                difficulty: difficultyMap(item.difficulty),
                constraints: item.constraints?.toString().trim() || "Not provided.",
                starterCode: asJsonValue(buildStarterCode()),
                publicTestCases: asJsonValue(publicTestCases),
                hiddenTestCases: asJsonValue(hiddenTestCases),
            },
            create: {
                title,
                slug,
                description: item.description?.toString().trim() || "No description provided.",
                difficulty: difficultyMap(item.difficulty),
                constraints: item.constraints?.toString().trim() || "Not provided.",
                starterCode: asJsonValue(buildStarterCode()),
                publicTestCases: asJsonValue(publicTestCases),
                hiddenTestCases: asJsonValue(hiddenTestCases),
            },
        });

        createdCount += 1;
    }

    console.log(`Successfully seeded ${createdCount} problems into PostgreSQL.`);
};

seedData()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error("Seeding failed:", error);
        await prisma.$disconnect();
        process.exit(1);
    });