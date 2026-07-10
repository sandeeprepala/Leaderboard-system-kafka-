import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard } from '../context/LeaderboardContext';
import { incrementScore } from '../api/leaderboard';
import { questions } from '../data/questions';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { FiCheckCircle, FiXCircle, FiTrendingUp, FiAward, FiGlobe, FiClock, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Quiz() {
  const { user, refreshUserStats } = useAuth();
  const { globalLeaderboard, regionalLeaderboard, refreshLeaderboards } = useLeaderboard();

  // Quiz Engine State
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // questionId -> optionIndex
  const [isCorrectState, setIsCorrectState] = useState({}); // questionId -> boolean (whether correct answer has been sent)
  const [sessionStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [quizFinished, setQuizFinished] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('global');

  // Stats for summary
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const timerRef = useRef(null);

  // Initialize Quiz
  useEffect(() => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, 10);
    setActiveQuestions(shuffled);
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (quizFinished) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [quizFinished]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectOption = async (questionId, optionIndex) => {
    if (quizFinished) return;

    // Save choice locally
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));

    const question = activeQuestions.find((q) => q.id === questionId);
    const isCorrect = optionIndex === question.correctOption;

    // Check if correct option was chosen and not already credited
    if (isCorrect && !isCorrectState[questionId]) {
      // Mark it as credited immediately to avoid multiple clicks
      setIsCorrectState((prev) => ({
        ...prev,
        [questionId]: true
      }));

      // Generate a unique Idempotency Key for this specific question-answer event in this session
      const idempotencyKey = `quiz-session-${sessionStartTime}-q-${questionId}`;

      try {
        const updateRes = await incrementScore(question.marks, idempotencyKey);
        if (updateRes.success) {
          toast.success(`Correct! +${question.marks} marks added to your database shard.`);
          setCorrectCount(prev => prev + 1);
          // Sync ranks
          await refreshUserStats(user.id);
          await refreshLeaderboards();
        }
      } catch (err) {
        console.error('Failed to post score:', err);
        toast.error('Failed to update score. Rate limit or connection issue.');
      }
    } else if (!isCorrect && isCorrectState[questionId]) {
      // If they previously got it right but changed it to a wrong answer
      // (Optional: We don't decrement points in this quiz structure unless requested, so we keep points or handle as wrong)
      // Just mark it as no longer correctly answered in local state
      setIsCorrectState((prev) => ({
        ...prev,
        [questionId]: false
      }));
      setCorrectCount(prev => Math.max(0, prev - 1));
      setWrongCount(prev => prev + 1);
    } else if (!isCorrect && !isCorrectState[questionId]) {
      // Incorrect answer select
      // Just register in stats
      setWrongCount(prev => prev + 1);
    }
  };

  const handleFinishQuiz = async () => {
    setQuizFinished(true);
    clearInterval(timerRef.current);
    toast.success('Quiz Completed! Reviewing scores...');
    
    // Sync final ranks
    if (user?.id) {
      await refreshUserStats(user.id);
      await refreshLeaderboards();
    }
  };

  const currentQuestion = activeQuestions[currentIndex];
  const activeLeaderboard = leaderboardTab === 'global' ? globalLeaderboard : regionalLeaderboard;

  return (
    <div className="min-h-screen bg-bgDark flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <main className="flex-grow p-6 md:p-8 w-full max-w-7xl mx-auto">
          
          <AnimatePresence mode="wait">
            {!quizFinished ? (
              // --- ACTIVE QUIZ SPLIT VIEW ---
              <motion.div 
                key="active-quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Side: Quiz Panel */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">CS Quiz Challenge</h1>
                      <p className="text-textSecondary text-xs">Verify your computer science expertise</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-borderLight text-accentBlue font-bold text-sm">
                      <FiClock className="animate-pulse" />
                      {formatTime(timeRemaining)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-borderLight">
                    <div 
                      className="accent-gradient h-full transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / 10) * 100}%` }}
                    />
                  </div>

                  {currentQuestion && (
                    <GlassCard hoverEffect={false} className="border border-white/[0.08] p-8">
                      <div className="text-textSecondary text-xs mb-3 font-semibold uppercase tracking-wider">
                        Question {currentIndex + 1} of 10 • {currentQuestion.marks} Marks
                      </div>
                      <h2 className="text-xl font-bold text-white mb-8">{currentQuestion.question}</h2>

                      <div className="space-y-4">
                        {currentQuestion.options.map((option, idx) => {
                          const isSelected = selectedOptions[currentQuestion.id] === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectOption(currentQuestion.id, idx)}
                              className={`w-full text-left p-4 rounded-xl text-sm font-medium border transition-all ${
                                isSelected
                                  ? 'bg-accentBlue/10 border-accentBlue text-white shadow-glow'
                                  : 'bg-white/5 border-borderLight text-textSecondary hover:bg-white/[0.08] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {isSelected && <FiCheck className="text-accentBlue w-4 h-4" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Question Navigation */}
                      <div className="flex items-center justify-between mt-10">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentIndex === 0}
                        >
                          Previous
                        </Button>

                        {currentIndex < 9 ? (
                          <Button
                            variant="secondary"
                            onClick={() => setCurrentIndex(prev => Math.min(9, prev + 1))}
                          >
                            Next Question
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={handleFinishQuiz}
                          >
                            Submit Quiz
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  )}
                </div>

                {/* Right Side: Real-time Leaderboard Side-panel */}
                <div className="space-y-6">
                  <GlassCard hoverEffect={false} className="p-6 border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="font-bold text-white text-lg">Realtime Leaderboard</div>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>

                    {/* Tabs */}
                    <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-borderLight mb-6">
                      <button
                        onClick={() => setLeaderboardTab('global')}
                        className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                          leaderboardTab === 'global' ? 'bg-accentBlue text-white shadow-glow' : 'text-textSecondary hover:text-white'
                        }`}
                      >
                        Global
                      </button>
                      <button
                        onClick={() => setLeaderboardTab('regional')}
                        className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                          leaderboardTab === 'regional' ? 'bg-accentBlue text-white shadow-glow' : 'text-textSecondary hover:text-white'
                        }`}
                      >
                        Regional ({user?.region})
                      </button>
                    </div>

                    {/* Ranking Rows */}
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {activeLeaderboard.length === 0 ? (
                        <div className="text-center text-xs text-textSecondary py-10">No leaderboard entries found.</div>
                      ) : (
                        activeLeaderboard.map((row, idx) => {
                          const isCurrentUser = row.username === user?.username;
                          return (
                            <div
                              key={row.username}
                              className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium transition-all ${
                                isCurrentUser
                                  ? 'bg-accentBlue/10 border-accentBlue/40 text-white shadow-glow'
                                  : 'bg-white/5 border-borderLight text-textSecondary'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                                  idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-textSecondary'
                                }`}>
                                  {idx + 1}
                                </div>
                                <span className={isCurrentUser ? 'font-bold' : ''}>{row.username}</span>
                              </div>
                              <span className="font-bold text-white">{row.score} <span className="text-[10px] text-textSecondary font-normal">pts</span></span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            ) : (
              // --- QUIZ SUMMARY COMPLETION PAGE ---
              <motion.div
                key="quiz-summary"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-4xl font-extrabold text-white mb-2">Quiz Completed!</h1>
                  <p className="text-textSecondary text-sm">Review your results and dynamic leaderboard standing below.</p>
                </div>

                {/* Score Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GlassCard hoverEffect={false} className="p-6 text-center border-emerald-500/20">
                    <FiCheckCircle className="text-emerald-400 w-8 h-8 mx-auto mb-3" />
                    <div className="text-textSecondary text-xs uppercase tracking-wider mb-1">Correct Answers</div>
                    <div className="text-3xl font-extrabold text-white">{correctCount} <span className="text-xs text-textSecondary">/ 10</span></div>
                  </GlassCard>

                  <GlassCard hoverEffect={false} className="p-6 text-center border-red-500/20">
                    <FiXCircle className="text-red-400 w-8 h-8 mx-auto mb-3" />
                    <div className="text-textSecondary text-xs uppercase tracking-wider mb-1">Wrong Answers</div>
                    <div className="text-3xl font-extrabold text-white">{wrongCount} <span className="text-xs text-textSecondary">/ 10</span></div>
                  </GlassCard>

                  <GlassCard hoverEffect={false} className="p-6 text-center border-accentBlue/20">
                    <FiAward className="text-accentBlue w-8 h-8 mx-auto mb-3" />
                    <div className="text-textSecondary text-xs uppercase tracking-wider mb-1">Current Score</div>
                    <div className="text-3xl font-extrabold text-white">{user?.score ?? 0} <span className="text-xs text-textSecondary">pts</span></div>
                  </GlassCard>
                </div>

                {/* Leaderboard comparisons after quiz */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Top 10 Global */}
                  <GlassCard hoverEffect={false} className="border border-white/[0.08]">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FiTrendingUp className="text-accentBlue" />
                      Top Global Leaderboard
                    </h3>
                    <div className="space-y-2">
                      {globalLeaderboard.slice(0, 5).map((row, idx) => (
                        <div key={row.username} className="flex justify-between p-3 rounded-lg bg-white/5 border border-borderLight text-xs">
                          <span>{idx + 1}. {row.username}</span>
                          <span className="font-bold">{row.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Top 10 Regional */}
                  <GlassCard hoverEffect={false} className="border border-white/[0.08]">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FiGlobe className="text-accentBlue" />
                      Top Regional ({user?.region})
                    </h3>
                    <div className="space-y-2">
                      {regionalLeaderboard.slice(0, 5).map((row, idx) => (
                        <div key={row.username} className="flex justify-between p-3 rounded-lg bg-white/5 border border-borderLight text-xs">
                          <span>{idx + 1}. {row.username}</span>
                          <span className="font-bold">{row.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                <div className="flex justify-center gap-4">
                  <Button onClick={() => window.location.reload()} variant="primary">
                    Play Again
                  </Button>
                  <Button onClick={() => navigate('/home')} variant="secondary">
                    Back to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
