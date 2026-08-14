import { WandBoxService } from './wandbox.service.js';
import { SubmissionVerdict } from '@prisma/client'

export interface TestCase {
    input: string;
    output: string;
}

export interface JudgeResult {
    verdict: SubmissionVerdict;
    executionTime: number;
    error?: string;
}

// Per-test-case breakdown, safe to show to the user (only ever built from
// PUBLIC test cases — never call this with hidden ones, it leaks expected output).
export interface TestCaseResult {
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    passed: boolean;
    error?: string;
}

export type Checker = (input: string, expectedOutput: string, actualOutput: string) => boolean;



export class JudgeService {
    // Wandbox's own docs warn about per-IP rate limits — firing every test
    // case at once (previous version of this file) is exactly the pattern
    // that trips it, especially with two players submitting around the same
    // time from the same server IP. Cap how many requests are in flight.
    private static readonly MAX_CONCURRENT_REQUESTS = 3;

    private static normalizeOutput(str: string): string {
        return str
        .replace(/\r\n/g, '\n') 
        .replace(/\n+$/g, '')   
        .trim();
    }

    // Json columns don't enforce a shape — a row edited by hand in Prisma
    // Studio, or seeded before the seed-script fix, can have a number/object
    // where a string is expected. Coerce here so a bad row fails one test
    // case cleanly instead of throwing and taking down the whole judge run.
    private static coerce(testcase: TestCase): TestCase {
        return {
            input: typeof testcase.input === 'string' ? testcase.input : JSON.stringify(testcase.input ?? ''),
            output: typeof testcase.output === 'string' ? testcase.output : JSON.stringify(testcase.output ?? ''),
        };
    }

    // Runs `items` through `worker`, at most `limit` in flight at once —
    // same idea as p-limit, written inline so this doesn't need a new dependency.
    private static async mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
        const results: R[] = new Array(items.length);
        let nextIndex = 0;

        const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (nextIndex < items.length) {
                const current = nextIndex++;
                results[current] = await worker(items[current] as T);
            }
        });

        await Promise.all(runners);
        return results;
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Runs one test case and never throws — a Wandbox timeout/network error/
    // rate-limit becomes a failed result instead of an unhandled rejection
    // that would otherwise take down the whole batch. Retries once on a
    // timeout, since that's the most likely symptom of a transient rate-limit
    // hit rather than a real, permanent failure.
    private static async runOne(code: string, language: string, rawTestcase: TestCase) {
    const testcase = this.coerce(rawTestcase);
    const formatInput = testcase.input.replace(/\r\n/g, '\n');

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const result = await WandBoxService.runCode(code, language, formatInput);
            return { testcase, result, judgeError: undefined as string | undefined };
        } catch (err: any) {
            const isRetryable =
                err?.code === 'ECONNABORTED' ||
                err?.code === 'ECONNRESET' ||
                !err?.response; // no response object = network/stream-level failure

            if (isRetryable && attempt === 0) {
                await this.sleep(500);
                continue;
            }
            return {
                testcase,
                result: null,
                judgeError: isRetryable
                    ? 'Judge timed out waiting for the compiler service.'
                    : (err?.message || 'Judge service unavailable.')
            };
        }
    }
    return { testcase, result: null, judgeError: 'Judge service unavailable.' };
}

    static async evaluate(
    code: string,
    language: string,
    testCases: TestCase[],
    checker?: Checker
): Promise<JudgeResult> {
    const runs = await this.mapWithConcurrency(
        testCases,
        this.MAX_CONCURRENT_REQUESTS,
        (testcase) => this.runOne(code, language, testcase)
    );

    let maxExecutionTime = 0;
    for (const { testcase, result, judgeError } of runs) {
        if (judgeError || !result) {
            return { verdict: SubmissionVerdict.SYSTEM_ERROR, executionTime: 0, error: judgeError || 'Judge service unavailable.' };
        }
        if (result.status !== 0) {
            return {
                verdict: result.compilerOutput ? SubmissionVerdict.COMPILATION_ERROR : SubmissionVerdict.RUNTIME_ERROR,
                executionTime: 0,
                ...(result.compilerOutput || result.programErr ? { error: result.compilerOutput || result.programErr } : {})
            };
        }

        const actualOutput = this.normalizeOutput(result.programOutput || '');
        const expectedOutput = this.normalizeOutput(testcase.output);

        const isCorrect = checker
            ? checker(testcase.input, expectedOutput, actualOutput)
            : actualOutput === expectedOutput;

        if (!isCorrect) {
            return { verdict: SubmissionVerdict.WRONG_ANSWER, executionTime: result.time || 0 };
        }

        maxExecutionTime = Math.max(maxExecutionTime, result.time || 0);
    }
    return { verdict: SubmissionVerdict.ACCEPTED, executionTime: maxExecutionTime };
}
    static async runAll(code: string, language: string, testCases: TestCase[]): Promise<TestCaseResult[]> {
        const runs = await this.mapWithConcurrency(
            testCases,
            this.MAX_CONCURRENT_REQUESTS,
            (testcase) => this.runOne(code, language, testcase)
        );

        return runs.map(({ testcase, result, judgeError }) => {
            if (judgeError || !result) {
                return {
                    input: testcase.input,
                    expectedOutput: testcase.output,
                    passed: false,
                    error: judgeError || 'Judge service unavailable.'
                };
            }

            if (result.status !== 0) {
                return {
                    input: testcase.input,
                    expectedOutput: testcase.output,
                    passed: false,
                    error: result.compilerOutput || result.programErr || 'Runtime error.'
                };
            }

            const actualOutput = this.normalizeOutput(result.programOutput || '');
            const expectedOutput = this.normalizeOutput(testcase.output);
            return {
                input: testcase.input,
                expectedOutput,
                actualOutput,
                passed: actualOutput === expectedOutput
            };
        });
    }
}