    import { createMatch, finishMatch, getMatchById } from "../controllers/match.controller.js";
    import { AuthMiddleware } from "../middlewares/auth.middleware.js";
    import { Router } from "express";

    const router = Router();

    router.post("/startMatch", AuthMiddleware, createMatch);
    router.get("/:matchId", AuthMiddleware, getMatchById);
    router.post("/finishMatch", AuthMiddleware, finishMatch);

    export default router;