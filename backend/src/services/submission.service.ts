// services/submission.service.ts
import { prisma } from '../config/db.js';
import { JudgeService, type TestCase } from './judge.service.js';
import { MatchStatus, SubmissionVerdict } from '@prisma/client';
import { MatchService } from './match.service.js';
import { getIO } from '../sockets/index.js';

export interface CreateSubmissionDto {
  userId: string;
  matchId: string;
  code: string;
  language: string;
}

export class SubmissionService {
  static async submitCode(dto: CreateSubmissionDto) {
    const { userId, matchId, code, language } = dto;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { problem: true }
    });

    if (!match || match.status !== MatchStatus.IN_PROGRESS) {
      throw new Error("Match is not active.");
    }

    if (match.player1Id !== userId && match.player2Id !== userId) {
      throw new Error("User does not belong to this match.");
    }

    if (!match.problem) {
      throw new Error("No problem attached to this match.");
    }

    const testCases = [
      ...(match.problem.publicTestCases as unknown as TestCase[]),
      ...(match.problem.hiddenTestCases as unknown as TestCase[])
    ];

    const submission = await prisma.submission.create({
      data: {
        userId,
        matchId,
        problemId: match.problem.id,
        code,
        language,
        status: SubmissionVerdict.RUNNING
      }
    });

    const judgeResult = await JudgeService.evaluate(code, language, testCases);

    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: judgeResult.verdict,
        executionTime: judgeResult.executionTime
      }
    });

    if (judgeResult.verdict === SubmissionVerdict.ACCEPTED) {
      const finishedMatch = await MatchService.finishMatch({ matchId, winnerId: userId });
      getIO().to(`match-${matchId}`).emit('match:ended', finishedMatch);
    } else {
      // Let the opponent know a submission came in and what happened to it —
      // otherwise only the submitting player ever finds out.
      getIO().to(`match-${matchId}`).emit('match:opponent_submitted', {
        userId,
        passed: false,
        verdict: judgeResult.verdict
      });
    }

    // judgeResult.error isn't a DB column (schema has no field for it) — attach
    // it to the response directly so the frontend can show *why* it failed.
    return { ...updatedSubmission, error: judgeResult.error };
  }

  static async runPublicTestCases(dto: CreateSubmissionDto) {
    const { userId, matchId, code, language } = dto;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { problem: true }
    });

    if (!match || match.status !== MatchStatus.IN_PROGRESS) {
      throw new Error("Match is not active.");
    }

    if (match.player1Id !== userId && match.player2Id !== userId) {
      throw new Error("User does not belong to this match.");
    }

    if (!match.problem) {
      throw new Error("No problem attached to this match.");
    }

    const publicTestCases = match.problem.publicTestCases as unknown as TestCase[];
    // Per-test-case pass/fail breakdown — safe here since these are the
    // PUBLIC test cases only, never the hidden ones.
    return JudgeService.runAll(code, language, publicTestCases);
  }
}