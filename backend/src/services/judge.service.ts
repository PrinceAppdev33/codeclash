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


export class JudgeService {
    private static normalizeOutput(str: string): string {
        return str
        .replace(/\r\n/g, '\n') 
        .replace(/\n+$/g, '')   
        .trim();
    }

    static async evaluate(code: string, language: string, testCases: TestCase[]): Promise<JudgeResult> {
        let maxExecutionTime = 0;
        for(const testcase of testCases) {
            const formatInput = testcase.input.replace(/\\r\\n/g, '\n');
            const result = await WandBoxService.runCode(code, language, formatInput);

            if(result.status !== 0) {
                return {
                    verdict: result.compilerOutput ? SubmissionVerdict.COMPILATION_ERROR : SubmissionVerdict.RUNTIME_ERROR,
                    executionTime: 0,
                    ...(result.compilerOutput || result.programErr
                        ? { error: result.compilerOutput || result.programErr }
                        : {})
                };
            }

            const actualOutput = this.normalizeOutput(result.programOutput || '');
            const expectedOutput = testcase.output.trim();
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
}
