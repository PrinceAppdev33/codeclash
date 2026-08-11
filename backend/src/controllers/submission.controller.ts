import { SubmissionService } from '../services/submission.service.js';
import type { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const submitCode = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { matchId, code, language } = req.body;

        if (!userId || !matchId || !code || !language) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "Missing required fields: matchId, code, language",
                err: {}
            });
        }

        const submission = await SubmissionService.submitCode({ userId, matchId, code, language });

        return res.status(200).json({
            data: submission,
            success: true,
            message: "Code submitted successfully",
            err: {}
        });
    } catch (error: any) {
        console.error("submitCode Error:", error);
        return res.status(400).json({
            data: {},
            success: false,
            message: "Code submission failed",
            err: error.message || error
        });
    }
}


export const runPublicTestCases = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { matchId, code, language } = req.body;

        if (!userId || !matchId || !code || !language) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "Missing required fields: matchId, code, language",
                err: {}
            });
        }

        const submission = await SubmissionService.runPublicTestCases({ userId, matchId, code, language });

        return res.status(200).json({
            data: submission,
            success: true,
            message: "Public test cases executed successfully",
            err: {}
        });
    } catch (error: any) {
        console.error("runPublicTestCases Error:", error);
        return res.status(400).json({
            data: {},
            success: false,
            message: "Running public test cases failed",
            err: error.message || error
        });
    }
}