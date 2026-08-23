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
                input: typeof record.input === "string" ? record.input : JSON.stringify(record.input),
                output: typeof record.output === "string" ? record.output : JSON.stringify(record.output),
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

async function withRetry<T>(operation: () => Promise<T>, label: string, attempts = 5): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.warn(`  ${label} failed (attempt ${attempt}/${attempts}), retrying...`);
            await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
            await prisma.$disconnect().catch(() => {});
            await prisma.$connect().catch(() => {});
        }
    }
    throw lastError;
}

const seedData = async () => {
    if (!fs.existsSync(seedFilePath)) {
        throw new Error(`Seed file not found at ${seedFilePath}. Run download.py first.`);
    }

    const rawData = fs.readFileSync(seedFilePath, "utf-8");
    const data = JSON.parse(rawData) as ContestProblem[];

    console.log("Clearing existing records...");
    await withRetry(() => prisma.submission.deleteMany(), "Clearing submissions");
    await withRetry(() => prisma.match.deleteMany(), "Clearing matches");
    await withRetry(() => prisma.problem.deleteMany(), "Clearing problems");

    console.log(`Starting migration for ${data.length} items...`);

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const title = item.name?.toString().trim() || `Problem ${i + 1}`;
        
        // Form normalizer arrays cleanly mapped out
        const publicTestCases = normalizeTestCases(item.publicTestCases);
        const hiddenTestCases = normalizeTestCases(item.hiddenTestCases);

        await withRetry(async () => {
            await prisma.problem.create({
                data: {
                    id: item.id || `prob-${i + 1}`,
                    title: title,
                    slug: slugify(title, item.id || i + 1),
                    description: item.description || "No description provided.",
                    difficulty: difficultyMap(item.difficulty),
                    constraints: item.constraints || "",
                    starterCode: buildStarterCode() as Prisma.InputJsonValue,
                    // Stringify the payload structure down explicitly for the adapter
                    publicTestCases: JSON.parse(JSON.stringify(publicTestCases)) as Prisma.InputJsonValue,
                    hiddenTestCases: JSON.parse(JSON.stringify(hiddenTestCases)) as Prisma.InputJsonValue,
                }
            });
        }, `Inserting problem [${i + 1}/${data.length}]: ${title}`);

        // Give the network connection a moment to breathe
        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    console.log("Successfully seeded your database!");
};

seedData()
  .catch((err) => {
      console.error("Fatal seed error:", err);
      process.exit(1);
  })
  .finally(() => prisma.$disconnect());

