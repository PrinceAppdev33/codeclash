import { MatchService } from '../services/match.service.js';
import type { Request, Response } from 'express';

export const createMatch = async (req: Request, res: Response) => {
    try {
        const match = await MatchService.createMatch(req.body);
        return res.status(201).json({
            data: match,
            success: true,
            message: "Match created successfully",
            err: {}
        });
    } catch (error: any) {
        console.error("createMatch Error:", error);
        return res.status(400).json({
            data: {},
            success: false,
            message: "Match creation failed",
            err: error.message || error
        });
    }
};

export const getMatchById = async (req: Request, res: Response) => {
    try {
       
        const rawMatchId = req.params.id || req.params.matchId;

        if (!rawMatchId || Array.isArray(rawMatchId)) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "A valid, single Match ID is required",
                err: {}
            });
        }

        const matchId: string = rawMatchId;
        const match = await MatchService.getMatchById(matchId);

        return res.status(200).json({
            data: match,
            success: true,
            message: "Match fetched successfully",
            err: {}
        });
    } catch (error: any) {
        console.error("getMatchById Error:", error);
        return res.status(404).json({
            data: {},
            success: false,
            message: "Match not found",
            err: error.message || error
        });
    }
};

export const finishMatch = async (req: Request, res: Response) => {
    try {

        const { matchId, winnerId } = req.body;

        if (!matchId) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "Match ID is required",
                err: {}
            });
        }

        const updatedMatch = await MatchService.finishMatch({
            matchId,
            winnerId: winnerId || null 
        });

        return res.status(200).json({
            data: updatedMatch,
            success: true,
            message: "Match finished successfully",
            err: {}
        });
    } catch (error: any) {
        console.error("finishMatch Error:", error);
        return res.status(400).json({
            data: {},
            success: false,
            message: "Failed to finish match",
            err: error.message || error
        });
    }
};