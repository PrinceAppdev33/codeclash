import { UserService }  from "../services/user.service.js";
import type { Request, Response } from "express";
import type { RegisterEmailInput } from "../services/user.service.js"
import type { ParamsDictionary } from "express-serve-static-core";

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const registerWithEmail = async (req: Request, res: Response) => {
    try {
        const result = await UserService.registerWithEmail(req.body as RegisterEmailInput);
        return res.status(201).json(result);
    } catch (error: any) {
        console.log(error);
        return res.status(400).json({
            message: error.message || 'User registration failed'
        });
    }
}


export const loginWithEmail = async (req: Request, res: Response) => {
    try {
        const result = await UserService.loginWithEmail(req.body);
        return res.status(200).json(result);
    } catch (error: any) {
        console.log(error);
        return res.status(401).json({
            message: error.message || 'User login failed'
        });
    }
}


export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "User ID is required",
                err: {}
            });
        }

        const user = await UserService.getUserProfile(userId);

        return res.status(200).json({
            data: user,
            success: true,
            message: "User profile fetched successfully",
            err: {}
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "User profile fetch failed",
            err: error
        });
    }
}


