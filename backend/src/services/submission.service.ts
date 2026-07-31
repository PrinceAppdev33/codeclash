// services/submission.service.ts
import { prisma } from '../config/db.js';
import { JudgeService, type TestCase } from './judge.service.js';
import { MatchStatus, SubmissionVerdict } from '@prisma/client';
import { MatchService } from './match.service.js';

export interface CreateSubmissionDto {
  userId: string;
  matchId: string;
  code: string;
  language: string;
}

export class SubmissionService {
  static async submitCode(dto: CreateSubmissionDto) {
    const { userId, matchId, code, language } = dto;

    // 1. Validate Match & Player Eligibility
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

    // 2. Extract Hidden + Public Testcases safely from JSON
    const testCases = [
      ...(match.problem.publicTestCases as unknown as TestCase[]),
      ...(match.problem.hiddenTestCases as unknown as TestCase[])
    ];

    // 3. Create initial pending submission record
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

    // 4. Run Evaluation
    const judgeResult = await JudgeService.evaluate(code, language, testCases);

    // 5. Update Submission Record
    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: judgeResult.verdict,
        executionTime: judgeResult.executionTime
      }
    });

    // 6. Trigger Match End if Accepted
    if (judgeResult.verdict === SubmissionVerdict.ACCEPTED) {
      await MatchService.finishMatch({ matchId, winnerId: userId });
    }

    return updatedSubmission;
  }
}