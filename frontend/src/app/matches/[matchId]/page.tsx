'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import profileWall from '../../../../public/images/cactus.png';
import { getSocket } from '../../../lib/socket';
import { useAppSelector } from '@/redux/hooks';

const CodeEditor = dynamic(() => import('../../../components/match/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#1c140d] text-[#fff8e7]">
      INITIALIZING IDE...
    </div>
  ),
});

const LANGUAGES = ['JavaScript', 'Python', 'C++', 'Java'] as const;
type Language = (typeof LANGUAGES)[number];

const MONACO_LANG_MAP: Record<Language, string> = {
  JavaScript: 'javascript',
  Python: 'python',
  'C++': 'cpp',
  Java: 'java',
};

const STARTER: Record<Language, string> = {
  JavaScript: 'function solve() {\n  // write your solution here\n}\n',
  Python: 'def solve():\n    # write your solution here\n    pass\n',
  'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    // write your solution here\n    return 0;\n}\n',
  Java: 'public class Solution {\n    public static void main(String[] args) {\n        // write your solution here\n    }\n}\n',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PlayerInfo {
  id: string;
  username: string;
  elo: number;
}

interface ProblemInfo {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  constraints: string[];
  publicTestCases: { input: string; output: string }[];
}

interface MatchData {
  id: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
  problem: ProblemInfo;
  durationSeconds?: number;
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed: boolean;
  error?: string;
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const token = useAppSelector((state) => state.auth.token);
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentUserId = (currentUser as { id?: string; _id?: string } | null)?.id
    ?? (currentUser as { id?: string; _id?: string } | null)?._id;

  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('C++');
  const [code, setCode] = useState(STARTER['C++']);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(1800);
  const [opponentStatus, setOpponentStatus] = useState<string>('In Progress');

  // Fetch initial match details via REST API
  useEffect(() => {
    if (!matchId || !token) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`${API_URL}/api/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch match');
        const response = await res.json();
        setMatch(response.data);
        if (response.data.durationSeconds) {
          setSecondsLeft(response.data.durationSeconds);
        }
      } catch (err) {
        console.error(err);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId, token, router]);

  // WebSocket lifecycle & real-time event listeners
  useEffect(() => {
    if (!token || !matchId) return;

    const socket = getSocket(token);

    const handleMatchError = (error: { message: string }) => {
      console.error('Match error:', error);
      router.replace('/');
    };

    const handleOpponentSubmitted = (data: { userId: string; passed: boolean }) => {
      if (data.userId !== currentUserId) {
        setOpponentStatus(data.passed ? 'Submitted (Passed)' : 'Submitted (Failed)');
      }
    };

    const handleMatchEnded = (data: { winnerId: string }) => {
      const isWinner = data.winnerId === currentUserId;
      alert(isWinner ? 'Victory! You won the match.' : 'Defeat! Opponent finished first.');
      router.push('/');
    };

    socket.emit('join_match', matchId);
    socket.on('match:error', handleMatchError);
    socket.on('match:opponent_submitted', handleOpponentSubmitted);
    socket.on('match:ended', handleMatchEnded);

    return () => {
      socket.emit('leave_match', matchId);
      socket.off('match:error', handleMatchError);
      socket.off('match:opponent_submitted', handleOpponentSubmitted);
      socket.off('match:ended', handleMatchEnded);
    };
  }, [token, matchId, router, currentUserId]);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRunTests = async () => {
    if (!match?.problem) return;
    setRunning(true);
    setTestResults(null);

    try {
      const res = await fetch(`${API_URL}/api/execute/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language: MONACO_LANG_MAP[language],
          code,
          problemId: match.problem.id,
        }),
      });

      const data = await res.json();
      setTestResults(data.results || []);
    } catch (err) {
      console.error('Execution error:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!match?.problem) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/execute/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId,
          language: MONACO_LANG_MAP[language],
          code,
          problemId: match.problem.id,
        }),
      });

      const data = await res.json();
      setTestResults(data.results || []);

      if (data.passed && token) {
        const socket = getSocket(token);
        socket.emit('match:submit_success', { matchId, userId: currentUserId });
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#120a04] text-[#fff8e7]">
        LOADING MATCH...
      </div>
    );
  }

  const isPlayer1 = currentUserId === match?.player1.id;
  const you = isPlayer1 ? match?.player1 : match?.player2;
  const rival = isPlayer1 ? match?.player2 : match?.player1;
  const problem = match?.problem;

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden text-[#fff8e7]"
      style={{
        backgroundImage: `url(${profileWall.src})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '96px 96px',
        imageRendering: 'pixelated',
      }}
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#7a5230] bg-[#211207]/90 px-3">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="border border-[#fff8e7]/40 bg-[#2b1608] px-2.5 py-1 text-[11px] font-bold text-[#fff8e7] transition hover:bg-[#3b1a0b]"
        >
          {'< BACK TO TOWN'}
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#fff8e7]/60">YOU</span>
            <span>{you?.username || 'PLAYER'}</span>
            <span className="text-yellow-400 text-[10px]">{you?.elo ?? 1200} ELO</span>
          </div>

          <div className="flex items-center gap-1.5 border border-[#7a5230] bg-[#1c140d] px-3 py-0.5 rounded-sm">
            <span className="text-[10px] text-[#fff8e7]/50">TIME</span>
            <span className="font-mono text-yellow-400 tabular-nums">{minutes}:{seconds}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#fff8e7]/60">RIVAL</span>
            <span>{rival?.username || 'OPPONENT'}</span>
            <span className="text-yellow-400 text-[10px]">{rival?.elo ?? 1200} ELO</span>
            <span className="text-[9px] text-yellow-500/80">({opponentStatus})</span>
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-44px)] w-full gap-1 p-1 bg-[#120a04]">
        <section
          className="w-1/2 flex flex-col overflow-hidden border border-[#7a5230] text-[#fff8e7]"
          style={{
            backgroundImage: `url(${profileWall.src})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '96px 96px',
            imageRendering: 'pixelated',
          }}
        >
          <div className="flex-1 overflow-y-auto p-5 bg-[#211207]/90">
            <div className="mb-3 flex items-center gap-2">
              <h1 className="font-bold text-xl">{problem?.title || 'Problem Title'}</h1>
              <span className="bg-green-700 px-2 py-0.5 text-[10px] font-bold text-white rounded-sm">
                {problem?.difficulty || 'EASY'}
              </span>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-[#fff8e7]">
              {problem?.description || 'No description available.'}
            </p>

            <div className="mb-4 flex flex-col gap-3">
              {problem?.publicTestCases?.map((ex, i) => (
                <div key={i} className="border-l-2 border-[#7a5230] bg-[#29190a] p-3 text-xs">
                  <p className="font-bold text-[#fff8e7] mb-1">EXAMPLE {i + 1}</p>
                  <p className="font-mono"><span className="font-bold">Input: </span>{ex.input}</p>
                  <p className="font-mono"><span className="font-bold">Output: </span>{ex.output}</p>
                </div>
              ))}
            </div>

            {problem?.constraints && problem.constraints.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#fff8e7] mb-1">CONSTRAINTS</p>
                <ul className="list-disc space-y-0.5 pl-4 font-mono text-xs text-[#fff8e7]">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="w-1/2 flex flex-col overflow-hidden border border-[#7a5230] bg-[#1c140d]">
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#7a5230] bg-[#241a10] px-2">
            <div className="flex gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setLanguage(lang);
                    setCode(STARTER[lang]);
                  }}
                  className={`px-2.5 py-0.5 text-[11px] font-bold transition ${
                    language === lang
                      ? 'bg-yellow-500 text-[#1c140d]'
                      : 'bg-[#3b2a17] text-[#fff8e7]/70 hover:bg-[#4a3620]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={running || submitting}
                onClick={handleRunTests}
                className="bg-[#3b2a17] px-3 py-0.5 text-[11px] font-bold border border-[#7a5230] hover:bg-[#4a3620] disabled:opacity-50"
              >
                {running ? 'RUNNING...' : 'RUN TESTS'}
              </button>
              <button
                type="button"
                disabled={running || submitting}
                onClick={handleSubmit}
                className="bg-yellow-500 px-3 py-0.5 text-[11px] font-bold text-[#1c140d] hover:bg-yellow-400 disabled:opacity-50"
              >
                {submitting ? 'SUBMITTING...' : 'SUBMIT'}
              </button>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <CodeEditor
              language={MONACO_LANG_MAP[language]}
              value={code}
              onChange={(val) => setCode(val || '')}
            />
          </div>

          <div className="h-36 shrink-0 border-t border-[#7a5230] bg-[#241a10] p-3 text-xs font-mono overflow-y-auto">
            <p className="text-[#fff8e7]/60 font-bold mb-1">TEST RESULTS</p>
            {!testResults ? (
              <p className="text-[#fff8e7]/40">Run or submit your code to see output here...</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 rounded border ${
                      res.passed
                        ? 'border-green-600/50 bg-green-950/30 text-green-300'
                        : 'border-red-600/50 bg-red-950/30 text-red-300'
                    }`}
                  >
                    <p className="font-bold">Test #{idx + 1}: {res.passed ? 'PASSED' : 'FAILED'}</p>
                    <p>Input: {res.input}</p>
                    <p>Expected: {res.expectedOutput}</p>
                    {res.actualOutput && <p>Actual: {res.actualOutput}</p>}
                    {res.error && <p className="text-red-400">Error: {res.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}