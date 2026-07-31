import axios from 'axios'


export interface WandBoxExecutionResult {
    status: number;
    compilerOutput?: string;
    programOutput?: string;
    programErr?: string;
    time?: number;
}


export class WandBoxService {
    private static readonly WAND_BOX_URL = 'https://wandbox.org/api/compile.json';

    private static readonly COMPILER_MAP: Record<string, string> = {
        'cpp': 'gcc-head',
        'python': 'cpython-3.11.4',
        'java': 'openjdk-21.0.2',
        'javascript': 'nodejs-20.0.0',
    }

    static async runCode(code: string, language: string, stdin: string): Promise<WandBoxExecutionResult> {
        const compiler = this.COMPILER_MAP[language];
        if(!compiler) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const response = await axios.post(this.WAND_BOX_URL, {
            compiler,
            code,
            stdin,
        });
        
        return {
            status: parseInt(response.data.status, 10),
            compilerOutput: response.data.compiler_output,
            programOutput: response.data.program_output,
            programErr: response.data.program_error,
            time: response.data.time,
        };                                                                                                                                                                      
    }
}
