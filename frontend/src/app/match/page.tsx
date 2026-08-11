'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import profileWall from '../../../public/images/profileWall.png';
import { getSocket, disconnectSocket } from '../../lib/socket';
import { useAppSelector } from '@/redux/hooks';

const CodeEditor = dynamic(() => import('../../components/match/CodeEditor'), {
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
  JavaScript: 'function twoSum(nums, target) {\n  // your code here\n}\n',
  Python: 'def two_sum(nums, target):\n    # your code here\n    pass\n',
  'C++': 'vector<int> twoSum(vector<int>& nums, int target) {\n    // your code here\n}\n',
  Java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // your code here\n    }\n}\n',
};

const PROBLEM = {
  title: 'Two Sum',
  difficulty: 'Easy' as const,
  statement:
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Assume each input has exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9, so return [0, 1].' },
    { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' },
  ],
  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
};


export default function MatchPage() {
  const [language, setLanguage] = useState<Language>('C++');
  const [code, setCode] = useState(STARTER['C++']);
  const token = useAppSelector((state) => state.auth.token);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(24 * 60 + 13);
  
  useEffect(() => {
        if(!token) return;
        
        const socket = getSocket(token);
        
        const handleConnect = () => {
          console.log('Socket connected:', socket.id);
          socket.emit('queue:join');
        };
  
        const handleQueueJoined = () => {
          console.log('Successfully joined the matchmaking queue.');
        };
  
        const handleMatchFound = (match: any) => {
          console.log('Match found:', match);
          socket.emit('join_match', match.id);
        }
  
        const handleQueueError = (error: any) => {
          console.log('Match error:', error);
        }
  
        socket.on('connect', handleConnect);
        socket.on('queue:joined', handleQueueJoined);
        socket.on('match:found', handleMatchFound);
        socket.on('queue:error', handleQueueError);
  
  
        if(socket.connected) {
          handleConnect();
        }
        return () => {
          socket.emit('queue:leave');
          socket.off('connect', handleConnect);
          socket.off('queue:joined', handleQueueJoined);
          socket.off('match:found', handleMatchFound);
          socket.off('queue:error', handleQueueError);
          disconnectSocket();
        }
  }, [token]);
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

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
          className="border border-[#fff8e7]/40 bg-[#2b1608] px-2.5 py-1 text-[11px] font-bold text-[#fff8e7] transition hover:bg-[#3b1a0b]"
        >
          {'< BACK TO TOWN'}
        </button>

        {/* Inline Score & Timer Bar */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#fff8e7]/60">YOU</span>
            <span>ARYANNAIK-MAX</span>
            <span className="text-yellow-400 text-[10px]">1200 ELO</span>
          </div>

          <div className="flex items-center gap-1.5 border border-[#7a5230] bg-[#1c140d] px-3 py-0.5 rounded-sm">
            <span className="text-[10px] text-[#fff8e7]/50">TIME</span>
            <span className="font-mono text-yellow-400 tabular-nums">{minutes}:{seconds}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#fff8e7]/60">RIVAL</span>
            <span>RUSTY_JOE</span>
            <span className="text-yellow-400 text-[10px]">1180 ELO</span>
          </div>
        </div>
      </header>

      {/* 2. Full Space Workspace Grid */}
      <main className="flex h-[calc(100vh-44px)] w-full gap-1 p-1 bg-[#120a04]">
        {/* Left Panel: Problem Statement */}
        <section className="w-1/2 flex flex-col overflow-hidden border border-[#7a5230]  text-[#fff8e7]"
            style={{
                backgroundImage: `url(${profileWall.src})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '96px 96px',
                imageRendering: 'pixelated',
            }}
        >
          <div className="flex-1 overflow-y-auto p-5  bg-[#211207]/90">
            <div className="mb-3 flex items-center gap-2">
              <h1 className="font-bold text-xl">{PROBLEM.title}</h1>
              <span className="bg-green-700 px-2 py-0.5 text-[10px] font-bold text-white rounded-sm">
                EASY
              </span>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-[#fff8e7]">{PROBLEM.statement}</p>

            <div className="mb-4 flex flex-col gap-3">
              {PROBLEM.examples.map((ex, i) => (
                <div key={i} className="border-l-2 border-[#7a5230] bg-[#29190a] p-3 text-xs">
                  <p className="font-bold text-[#fff8e7] mb-1">EXAMPLE {i + 1}</p>
                  <p className="font-mono"><span className="font-bold">Input: </span>{ex.input}</p>
                  <p className="font-mono"><span className="font-bold">Output: </span>{ex.output}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold text-[#fff8e7] mb-1">CONSTRAINTS</p>
              <ul className="list-disc space-y-0.5 pl-4 font-mono text-xs text-[#fff8e7]">
                {PROBLEM.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
        </section>
        <section className="w-1/2 flex flex-col overflow-hidden border border-[#7a5230] bg-[#1c140d]">
          {/* Action Toolbar */}
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
                onClick={() => setRunning(true)}
                className="bg-[#3b2a17] px-3 py-0.5 text-[11px] font-bold border border-[#7a5230] hover:bg-[#4a3620]"
              >
                RUN TESTS
              </button>
              <button
                type="button"
                className="bg-yellow-500 px-3 py-0.5 text-[11px] font-bold text-[#1c140d] hover:bg-yellow-400"
              >
                SUBMIT
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

          {/* Output Window */}
          <div className="h-36 shrink-0 border-t border-[#7a5230] bg-[#241a10] p-3 text-xs font-mono">
            <p className="text-[#fff8e7]/60 font-bold mb-1">TEST RESULTS</p>
            <p className="text-[#fff8e7]/40">Run your code to see output here...</p>
          </div>
        </section>
      </main>
    </div>
  );
}