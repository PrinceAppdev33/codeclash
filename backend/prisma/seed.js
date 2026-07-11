import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/config/db.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.join(__dirname, "../script/data.json");
const difficultyMap = (difficulty) => {
    if (difficulty === undefined || difficulty === null) {
        return "EASY";
    }
    if (difficulty <= 4) {
        return "EASY";
    }
    if (difficulty <= 8) {
        return "MEDIUM";
    }
    return "HARD";
};
const slugify = (value, fallbackIndex) => {
    const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug.length > 0 ? slug : `problem-${fallbackIndex + 1}`;
};
const toJsonArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value;
};
const collectTestCases = (value, results = []) => {
    if (Array.isArray(value)) {
        for (const item of value) {
            collectTestCases(item, results);
        }
        return results;
    }
    if (!value || typeof value !== "object") {
        return results;
    }
    const record = value;
    if (Array.isArray(record.input) && Array.isArray(record.output)) {
        results.push({
            input: record.input,
            output: record.output,
            solution: record.solution,
        });
    }
    for (const nestedValue of Object.values(record)) {
        collectTestCases(nestedValue, results);
    }
    return results;
};
const buildStarterCode = () => ({
    javascript: "function solve(input) {\n  // Write your solution here\n}\n",
    typescript: "function solve(input: string): string {\n  // Write your solution here\n  return \"\";\n}\n",
    python: "def solve(input_data: str) -> str:\n    # Write your solution here\n    return \"\"\n",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n    return 0;\n}\n",
    java: "import java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        // Write your solution here\n    }\n}\n",
});
const asJsonValue = (value) => value;
const seedData = async () => {
    const rawData = fs.readFileSync(seedFilePath, "utf-8");
    const data = JSON.parse(rawData);
    if (!Array.isArray(data)) {
        throw new Error("Expected data.json to contain an array of problems.");
    }
    await prisma.submission.deleteMany();
    await prisma.match.deleteMany();
    await prisma.problem.deleteMany();
    let createdCount = 0;
    for (const [index, item] of data.entries()) {
        const testCases = collectTestCases(item);
        const publicTestCases = testCases.slice(0, Math.max(1, Math.min(2, testCases.length)));
        const hiddenTestCases = testCases.slice(publicTestCases.length);
        const title = item.name?.trim() || `Problem ${index + 1}`;
        const slug = slugify(title, index);
        await prisma.problem.upsert({
            where: { slug },
            update: {
                title,
                description: item.description?.trim() || "No description provided.",
                difficulty: difficultyMap(item.difficulty),
                constraints: "Not provided in source dataset.",
                starterCode: asJsonValue(buildStarterCode()),
                publicTestCases: asJsonValue(publicTestCases),
                hiddenTestCases: asJsonValue(hiddenTestCases),
            },
            create: {
                title,
                slug,
                description: item.description?.trim() || "No description provided.",
                difficulty: difficultyMap(item.difficulty),
                constraints: "Not provided in source dataset.",
                starterCode: asJsonValue(buildStarterCode()),
                publicTestCases: asJsonValue(publicTestCases),
                hiddenTestCases: asJsonValue(hiddenTestCases),
            },
        });
        createdCount += 1;
    }
    console.log(`Seeded ${createdCount} problems.`);
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
//# sourceMappingURL=seed.js.map