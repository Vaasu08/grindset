import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize, AlertTriangle, Clock, ChevronRight, Lock, Unlock, CheckCircle, Headphones, Coffee, Brain } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { fetchProblemBySlug } from '../api';
import { evaluateIntuition } from '../groq';
import './GrindSession.css';

const POMODORO_WORK = 50 * 60; 
const POMODORO_BREAK = 10 * 60; 

const GrindSession = ({ session }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionLength = location.state?.length || 90;
  
  const problemQueue = location.state?.problemQueue || [{ title_slug: 'two-sum' }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const problemSlug = problemQueue[currentIndex]?.title_slug;

  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(sessionLength * 60);
  const [problemTimeElapsed, setProblemTimeElapsed] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  
  const [pomodoroTimeElapsed, setPomodoroTimeElapsed] = useState(0);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(POMODORO_BREAK);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  
  const [step, setStep] = useState('commit'); 
  const [commitText, setCommitText] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  
  // Evaluation States
  const [evaluating, setEvaluating] = useState(false);
  const [commitFeedback, setCommitFeedback] = useState(null);
  const [reflectionFeedback, setReflectionFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProblem = async () => {
      if (!problemSlug) return;
      setLoadingProblem(true);
      try {
        const data = await fetchProblemBySlug(problemSlug);
        setProblem(data);
      } catch (err) {
        console.error("Error fetching problem:", err);
      } finally {
        setLoadingProblem(false);
      }
    };
    loadProblem();
  }, [problemSlug]);

  useEffect(() => {
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const toggleAudio = () => {
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement != null);
    const handleVisibilityChange = () => {
      if (document.hidden && step === 'solving' && !isBreakTime) {
        setTabSwitches(prev => prev + 1);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [step, isBreakTime]);

  useEffect(() => {
    if (loadingProblem) return;

    const timer = setInterval(() => {
      setSessionTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      
      if (isBreakTime) {
        setBreakTimeLeft(prev => {
          if (prev <= 1) {
            setIsBreakTime(false);
            setPomodoroTimeElapsed(0);
            return POMODORO_BREAK;
          }
          return prev - 1;
        });
      } else if (step === 'solving' || step === 'commit') {
        setProblemTimeElapsed(prev => prev + 1);
        setPomodoroTimeElapsed(prev => {
          if (prev >= POMODORO_WORK - 1) {
            setIsBreakTime(true);
            return POMODORO_WORK;
          }
          return prev + 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [step, isBreakTime, loadingProblem]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getActiveHints = () => {
    if (!problem || !problem.hints) return [];
    const minutesElapsed = Math.floor(problemTimeElapsed / 60);
    
    let allHints = problem.hints.map((text, i) => {
      const unlockTime = (i + 1) * 10; 
      return { time: unlockTime, text, unlocked: minutesElapsed >= unlockTime, type: 'Hint' };
    });

    if (problem.solution?.content) {
      const editorialTime = (problem.hints.length + 1) * 10;
      allHints.push({
        time: editorialTime,
        text: "Check the LeetCode editorial for the full solution.",
        unlocked: minutesElapsed >= editorialTime,
        type: 'Editorial'
      });
    }

    return allHints;
  };

  const handleCommitSubmit = async () => {
    setEvaluating(true);
    setCommitFeedback(null);
    
    const result = await evaluateIntuition(problem.title, problem.content, commitText, true);
    setEvaluating(false);

    if (result.status === 'error') {
      alert(result.message);
      return;
    }

    if (result.is_correct) {
      setStep('solving');
    } else {
      setCommitFeedback(result.feedback);
    }
  };

  const submitProblem = () => setStep('reflect');
  
  const handleReflectionSubmit = async () => {
    setEvaluating(true);
    setReflectionFeedback(null);
    
    const result = await evaluateIntuition(problem.title, problem.content, reflectionText, false);
    
    if (result.status === 'error') {
      setEvaluating(false);
      alert(result.message);
      return;
    }

    if (!result.is_correct) {
      setEvaluating(false);
      setReflectionFeedback(result.feedback);
      return;
    }

    // If correct, proceed to save
    setSaving(true);
    const userId = session?.user?.id;
    
    if (userId) {
      const usedHints = getActiveHints().filter(h => h.unlocked).length;
      
      await supabase.from('problem_history').insert([
        {
          user_id: userId,
          problem_slug: problemSlug,
          status: 'solved',
          hints_used: usedHints,
          time_taken_seconds: problemTimeElapsed
        }
      ]);

      const { data: existingSr } = await supabase
        .from('spaced_repetition')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_slug', problemSlug)
        .single();
      
      if (existingSr) {
        const newInterval = existingSr.interval * 2;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + newInterval);
        
        await supabase.from('spaced_repetition').update({
          interval: newInterval,
          next_review_date: nextDate.toISOString()
        }).eq('id', existingSr.id);
      } else {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1); 
        
        await supabase.from('spaced_repetition').insert([{
          user_id: userId,
          problem_slug: problemSlug,
          interval: 1,
          next_review_date: nextDate.toISOString()
        }]);
      }
    }

    setSaving(false);
    setEvaluating(false);
    
    if (currentIndex + 1 < problemQueue.length) {
      setLoadingProblem(true); // Fix: Immediately show loading state
      setCurrentIndex(prev => prev + 1);
      setStep('commit');
      setCommitText('');
      setReflectionText('');
      setCommitFeedback(null);
      setReflectionFeedback(null);
      setProblemTimeElapsed(0);
      setProblem(null);
      window.scrollTo(0, 0); 
    } else {
      alert("Session complete! You crushed all the queued problems!");
      navigate('/');
    }
  };
  
  const forceBreak = () => {
    setPomodoroTimeElapsed(POMODORO_WORK);
    setIsBreakTime(true);
  };

  // Fix: Check !problem to prevent crashes when transitioning between problems
  if (loadingProblem || !problem) {
    return <div className="grind-container flex items-center justify-center">Loading LeetCode Problem...</div>;
  }

  const timeLimit = 30; 

  return (
    <div className={`grind-container ${isFullscreen ? 'is-fullscreen' : ''}`}>
      
      <header className="grind-header flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="brand flex items-center gap-2">
            <span className="text-gradient font-display font-bold">GRINDSET</span>
          </div>
          <div className="vertical-divider"></div>
          
          <div className="session-timer flex items-center gap-2" title="Total Session Remaining">
            <Clock size={16} /> Session: {formatTime(sessionTimeLeft)}
          </div>
          
          <div className="pomodoro-timer flex items-center gap-2 text-warning" title="Pomodoro Work Time">
            <Coffee size={16} /> Pomo: {formatTime(POMODORO_WORK - pomodoroTimeElapsed)}
          </div>

          <div className={`problem-timer flex items-center gap-2 ${(problemTimeElapsed / 60) > timeLimit ? 'text-error animate-pulse' : ''}`}>
            Problem Elapsed: {formatTime(problemTimeElapsed)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="btn btn-outline" style={{padding: '4px 8px', fontSize: '12px'}} onClick={forceBreak}>
            Force Break (Debug)
          </button>

          <button className={`btn-icon ${isAudioPlaying ? 'text-success' : ''}`} onClick={toggleAudio} title="Toggle Ambient Audio">
            {isAudioPlaying ? <Headphones size={20} /> : <Headphones size={20} style={{opacity: 0.5}} />}
          </button>

          {tabSwitches > 0 && (
            <div className="warning-badge flex items-center gap-2 text-warning" title="You switched tabs or lost focus!">
              <AlertTriangle size={16} /> {tabSwitches} Distractions
            </div>
          )}
          
          <button className="btn-icon" onClick={toggleFullscreen} title="Toggle Fullscreen">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </header>

      <div className="focus-workspace flex-col items-center">
        <div className="focus-content-wrapper">
          
          <div className="problem-card glass-panel">
            <div className="problem-header flex justify-between items-center">
              <h2>{problem.title}</h2>
              <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>
                {problem.difficulty}
              </span>
            </div>
            <div className="flex gap-2" style={{marginBottom: '16px', flexWrap: 'wrap'}}>
              {problem.topicTags?.map((tag, i) => (
                <span key={i} style={{background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="problem-content" dangerouslySetInnerHTML={{__html: problem.content}}></div>
          </div>

          {step === 'commit' && (
            <motion.div 
              className="commit-card glass-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 text-accent-primary" style={{marginBottom: '16px'}}>
                <Brain size={20} />
                <h3 style={{margin: 0}}>Commit Before Code (AI Evaluated)</h3>
              </div>
              <p className="text-secondary" style={{marginBottom: '16px'}}>
                Write your approach and time/space complexity. Groq will evaluate your intuition before unlocking the hints.
              </p>
              
              <textarea 
                className="commit-textarea"
                placeholder="e.g. Approach: Use a hash map to store complements. Time: O(N), Space: O(N)"
                value={commitText}
                onChange={e => setCommitText(e.target.value)}
                rows={3}
                disabled={evaluating}
                style={{ borderColor: commitFeedback ? 'var(--error)' : '' }}
              />

              {commitFeedback && (
                <div className="text-error" style={{marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px'}}>
                  <strong>AI Feedback:</strong> {commitFeedback}
                </div>
              )}

              <button 
                className="btn btn-primary w-full"
                disabled={commitText.length < 10 || evaluating}
                onClick={handleCommitSubmit}
              >
                {evaluating ? 'Evaluating Intuition...' : 'Evaluate & Start Solving'}
              </button>
            </motion.div>
          )}

          {step === 'solving' && (
            <motion.div 
              className="hints-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex justify-between items-center" style={{marginBottom: '20px'}}>
                <h3>Stuck Protocol</h3>
                <span className="text-secondary" style={{fontSize: '0.9rem'}}>Hints unlock automatically based on time spent.</span>
              </div>
              
              <div className="hints-list flex-col gap-4">
                {getActiveHints().map((hint, i) => (
                  <div key={i} className={`hint-card ${hint.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="hint-header flex justify-between">
                      <span>{hint.type} {hint.type === 'Hint' ? i + 1 : ''} ({hint.time}m)</span>
                      {hint.unlocked ? <Unlock size={16} className="text-warning" /> : <Lock size={16} />}
                    </div>
                    {hint.unlocked ? (
                      <div className="hint-body editor-font" dangerouslySetInnerHTML={{__html: hint.text}}></div>
                    ) : (
                      <div className="hint-body locked-text text-muted">
                        Unlocks in {Math.max(0, hint.time - Math.floor(problemTimeElapsed / 60))} minutes...
                      </div>
                    )}
                  </div>
                ))}
                {getActiveHints().length === 0 && <div className="text-muted">No hints available for this problem.</div>}
              </div>

              <div className="completion-action mt-8 flex justify-center">
                <button className="btn btn-primary" style={{padding: '16px 32px', fontSize: '1.2rem'}} onClick={submitProblem}>
                  <CheckCircle size={20} /> I've Solved It
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      <AnimatePresence>
        {isBreakTime && (
          <motion.div 
            className="modal-overlay break-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="break-content flex-col items-center gap-6">
              <Coffee size={64} className="text-warning animate-pulse-glow" />
              <h1 className="text-gradient" style={{fontSize: '3rem'}}>FORCED BREAK</h1>
              <p style={{fontSize: '1.2rem', textAlign: 'center', maxWidth: '400px'}}>
                You've been in deep work for 50 minutes. Walk away, stretch, and reset your mind to prevent burnout.
              </p>
              <div className="break-timer" style={{fontSize: '4rem', fontFamily: 'var(--font-mono)'}}>
                {formatTime(breakTimeLeft)}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'reflect' && !isBreakTime && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content glass-panel border-success"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}
            >
              <div className="flex items-center gap-2 text-success" style={{marginBottom: '16px'}}>
                <Brain size={24} />
                <h2 style={{margin: 0}} className="text-success">Problem Solved!</h2>
              </div>
              <p>Forced Reflection: What was the key insight or pattern? Groq will verify your understanding before saving.</p>
              
              <textarea 
                className="commit-textarea"
                placeholder="e.g. The key insight was visualizing the problem as a graph instead of a tree..."
                value={reflectionText}
                onChange={e => setReflectionText(e.target.value)}
                rows={4}
                disabled={evaluating || saving}
                style={{ borderColor: reflectionFeedback ? 'var(--error)' : '' }}
              />

              {reflectionFeedback && (
                <div className="text-error" style={{marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px'}}>
                  <strong>AI Feedback:</strong> {reflectionFeedback}
                </div>
              )}
              
              <button 
                className="btn btn-primary w-full mt-4"
                disabled={reflectionText.length < 5 || evaluating || saving}
                onClick={handleReflectionSubmit}
              >
                {evaluating ? 'AI Verifying Insight...' : saving ? 'Saving to Database...' : 'Verify & Save to Spaced Repetition '}
                {(!saving && !evaluating) && <ChevronRight size={16} />}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrindSession;
