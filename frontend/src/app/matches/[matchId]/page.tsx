'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
// import profileWall from '../../../../public/images/cactus.png';
import { getSocket } from '../../../lib/socket';
import { useAppSelector } from '@/redux/hooks';

const CodeEditor = dynamic(() => import('../../../components/match/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#1c140d] text-[#e2e8f0] font-sans text-sm">
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

// Helper to render descriptions containing inline/block LaTeX formulas
const FormattedMathText = ({ text }: { text: string }) => {
  if (!text) return null;

  // Split on block math $$...$$ and inline math $...$
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return <BlockMath key={i} math={math} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath key={i} math={math} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

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
          matchId: match.id,
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
      <div className="flex h-screen w-screen items-center justify-center bg-[#120a04] text-[#e2e8f0] font-sans text-sm">
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
      className="flex h-screen w-screen flex-col overflow-hidden text-[#e2e8f0] font-sans text-sm"
      style={{
        fontFamily: "'Press Start 2P', 'VT323', monospace",
        backgroundColor: '#5a2c10',
        backgroundImage: "url('/images/profileWall.png')",
        backgroundSize: '128px 128px',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top left',
      }}
    >
      {/* HEADER */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#7a5230] bg-[#211207]/90 px-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="border border-[#7a5230] bg-[#2b1608] px-3 py-1 text-xs font-semibold text-[#fff8e7] transition hover:bg-[#3b1a0b] rounded"
        >
          &larr; BACK TO TOWN
        </button>

        <div className="flex items-center gap-6 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#fff8e7]/60 tracking-wider">YOU</span>
            <span className="text-[#fff8e7]">{you?.username || 'PLAYER'}</span>
            <span className="text-yellow-400 text-[11px] font-mono">{you?.elo ?? 1200} ELO</span>
          </div>

          <div className="flex items-center gap-2 border border-[#7a5230] bg-[#1c140d] px-3 py-1 rounded">
            <span className="text-[10px] text-[#fff8e7]/60 tracking-wider">TIME</span>
            <span className="font-mono text-yellow-400 text-sm font-bold tabular-nums">{minutes}:{seconds}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#fff8e7]/60 tracking-wider">RIVAL</span>
            <span className="text-[#fff8e7]">{rival?.username || 'OPPONENT'}</span>
            <span className="text-yellow-400 text-[11px] font-mono">{rival?.elo ?? 1200} ELO</span>
            <span className="text-[10px] text-yellow-500/80">({opponentStatus})</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex h-[calc(100vh-44px)] w-full gap-2 p-2 bg-[#120a04]">
        {/* LEFT COLUMN: PROBLEM STATEMENT */}
        <section
          className="w-1/2 flex flex-col overflow-hidden border border-[#7a5230] rounded bg-[#211207]/95"
          style={{
            fontFamily: "'Press Start 2P', 'VT323', monospace",
            backgroundColor: '#5a2c10',
            backgroundImage: "url('/images/profileWall.png')",
            backgroundSize: '128px 128px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'top left',
          }}
        >
          <div className="flex-1 overflow-y-auto p-6 bg-[#211207]/90 leading-relaxed">
            <div className="mb-4 flex items-center justify-between border-b border-[#7a5230]/40 pb-3">
              <h1 className="font-bold text-2xl text-white tracking-wide">{problem?.title || 'Problem Title'}</h1>
              <span className="bg-emerald-800/80 border border-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 rounded">
                {problem?.difficulty || 'EASY'}
              </span>
            </div>

            {/* DESCRIPTION WITH KATEX MATH */}
            <div className="mb-6 text-sm text-[#e2e8f0]/90 whitespace-pre-wrap leading-relaxed space-y-3">
              <FormattedMathText text={problem?.description || 'No description available.'} />
            </div>

            {/* EXAMPLES SECTION */}
            {problem?.publicTestCases && problem.publicTestCases.length > 0 && (
              <div className="mb-6 space-y-3">
                <h2 className="text-xs font-bold text-[#fff8e7] tracking-wider uppercase border-b border-[#7a5230]/30 pb-1">
                  Examples
                </h2>
                {problem.publicTestCases.map((ex, i) => (
                  <div key={i} className="rounded border border-[#7a5230]/60 bg-[#170c04] p-3 text-xs space-y-2">
                    <p className="font-bold text-yellow-400/90 text-[11px]">EXAMPLE {i + 1}</p>
                    <div>
                      <span className="text-[#fff8e7]/60 block mb-0.5">Input:</span>
                      <pre className="font-mono bg-[#0d0702] p-2 rounded text-[#e2e8f0] overflow-x-auto">{ex.input}</pre>
                    </div>
                    <div>
                      <span className="text-[#fff8e7]/60 block mb-0.5">Output:</span>
                      <pre className="font-mono bg-[#0d0702] p-2 rounded text-[#e2e8f0] overflow-x-auto">{ex.output}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CONSTRAINTS */}
            {problem?.constraints && problem.constraints.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-[#fff8e7] tracking-wider uppercase border-b border-[#7a5230]/30 pb-1">
                  Constraints
                </h2>
                <ul className="list-disc space-y-1 pl-5 font-mono text-xs text-[#e2e8f0]/80">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>
                      <FormattedMathText text={c} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: EDITOR & OUTPUT */}
        <section className="w-1/2 flex flex-col overflow-hidden border border-[#7a5230] rounded bg-[#1c140d]">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#7a5230] bg-[#241a10] px-3">
            <div className="flex gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setLanguage(lang);
                    setCode(STARTER[lang]);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded transition ${
                    language === lang
                      ? 'bg-yellow-500 text-[#1c140d]'
                      : 'bg-[#3b2a17] text-[#fff8e7]/70 hover:bg-[#4a3620]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={running || submitting}
                onClick={handleRunTests}
                className="bg-[#3b2a17] px-3.5 py-1 text-xs font-semibold border border-[#7a5230] hover:bg-[#4a3620] disabled:opacity-50 rounded"
              >
                {running ? 'RUNNING...' : 'RUN TESTS'}
              </button>
              <button
                type="button"
                disabled={running || submitting}
                onClick={handleSubmit}
                className="bg-yellow-500 px-3.5 py-1 text-xs font-semibold text-[#1c140d] hover:bg-yellow-400 disabled:opacity-50 rounded"
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

          {/* TEST RESULTS */}
          <div className="h-40 shrink-0 border-t border-[#7a5230] bg-[#170d06] p-3 text-xs font-mono overflow-y-auto">
            <p className="text-[#fff8e7]/60 font-bold mb-2 tracking-wider">TEST RESULTS</p>
            {!testResults ? (
              <p className="text-[#fff8e7]/40 italic">Run or submit your code to see output here...</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border ${
                      res.passed
                        ? 'border-emerald-600/50 bg-emerald-950/20 text-emerald-300'
                        : 'border-rose-600/50 bg-rose-950/20 text-rose-300'
                    }`}
                  >
                    <p className="font-bold mb-1">Test #{idx + 1}: {res.passed ? 'PASSED' : 'FAILED'}</p>
                    <p><span className="opacity-60">Input:</span> {res.input}</p>
                    <p><span className="opacity-60">Expected:</span> {res.expectedOutput}</p>
                    {res.actualOutput && <p><span className="opacity-60">Actual:</span> {res.actualOutput}</p>}
                    {res.error && <p className="text-rose-400 mt-1">Error: {res.error}</p>}
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