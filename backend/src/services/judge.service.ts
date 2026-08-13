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
        // Codeforces test data (via the open-r1/codeforces dataset) uses real
        // \r\n line endings baked into the strings. This used to be
        // `/\\r\\n/g`, which matches the literal 4 characters \,r,\,n and
        // never matched an actual CRLF — so it was a no-op.
        const formatInput = testcase.input.replace(/\r\n/g, '\n');

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const result = await WandBoxService.runCode(code, language, formatInput);
                return { testcase, result, judgeError: undefined as string | undefined };
            } catch (err: any) {
                const isTimeout = err?.code === 'ECONNABORTED';
                if (isTimeout && attempt === 0) {
                    await this.sleep(500); // brief backoff before the retry
                    continue;
                }
                return {
                    testcase,
                    result: null,
                    judgeError: isTimeout
                        ? 'Judge timed out waiting for the compiler service.'
                        : (err?.message || 'Judge service unavailable.')
                };
            }
        }
        // Unreachable, but keeps TypeScript happy about the loop always returning.
        return { testcase, result: null, judgeError: 'Judge service unavailable.' };
    }

    static async evaluate(code: string, language: string, testCases: TestCase[]): Promise<JudgeResult> {
        // Fire all test cases at the compiler service concurrently instead of
        // awaiting them one by one — each testcase is a separate network
        // round-trip + fresh compile, so this is the difference between one
        // round-trip's worth of latency and N of them stacked sequentially.
        const runs = await Promise.all(
            testCases.map((testcase) => this.runOne(code, language, testcase))
        );

        // Walk results in original test-case order so the reported verdict
        // (first failing case) stays identical to the old sequential behavior.
        let maxExecutionTime = 0;
        for (const { testcase, result, judgeError } of runs) {
            if (judgeError || !result) {
                return {
                    verdict: SubmissionVerdict.SYSTEM_ERROR,
                    executionTime: 0,
                    error: judgeError || 'Judge service unavailable.'
                };
            }

            if (result.status !== 0) {
                return {
                    verdict: result.compilerOutput ? SubmissionVerdict.COMPILATION_ERROR : SubmissionVerdict.RUNTIME_ERROR,
                    executionTime: 0,
                    ...(result.compilerOutput || result.programErr
                        ? { error: result.compilerOutput || result.programErr }
                        : {})
                };
            }

            const actualOutput = this.normalizeOutput(result.programOutput || '');
            // Was `testcase.output.trim()` — only strips leading/trailing
            // whitespace, leaving internal \r\n untouched. actualOutput above
            // DOES get \r\n collapsed to \n, so any multi-line expected
            // output (i.e. most problems) could never match, even for a
            // fully correct submission. Normalize both sides the same way.
            const expectedOutput = this.normalizeOutput(testcase.output);
            if (actualOutput !== expectedOutput) {
                return {
                verdict: SubmissionVerdict.WRONG_ANSWER,
                executionTime: result.time || 0
                };
            }

            maxExecutionTime = Math.max(maxExecutionTime, result.time || 0);
        }
        return {
            verdict: SubmissionVerdict.ACCEPTED,
            executionTime: maxExecutionTime
        };
    }

    // Runs every test case and returns a result for EACH one (no early exit),
    // so the frontend can show a per-testcase pass/fail list. Only ever pass
    // PUBLIC test cases here — the output includes expected/actual values.
    static async runAll(code: string, language: string, testCases: TestCase[]): Promise<TestCaseResult[]> {
        const runs = await Promise.all(
            testCases.map((testcase) => this.runOne(code, language, testcase))
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