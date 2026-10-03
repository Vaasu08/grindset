import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize, AlertTriangle, Clock, ChevronRight, Lock, Unlock, CheckCircle, Headphones, Coffee, Brain, Music, Flame, CloudRain, Waves, ExternalLink } from '../Icons';
import { supabase } from '../supabaseClient';
import { fetchProblemBySlug } from '../api';
import { evaluateIntuition } from '../groq';
import './GrindSession.css';

const POMODORO_WORK = 50 * 60; 
const POMODORO_BREAK = 10 * 60; 

const AUDIO_TRACKS = [
  { name: 'Young Girl A (Siinamota)', icon: 'flame', url: '/audio/young_girl_a.mp3' },
  { name: 'Lofi Hip Hop Radio', icon: 'music', url: '/audio/lofi.mp3' },
  { name: 'Heavy Rain & Thunder', icon: 'cloud-rain', url: '/audio/rain.mp3' },
  { name: 'Cafe Ambience', icon: 'coffee', url: '/audio/cafe.mp3' },
  { name: 'Deep Brown Noise', icon: 'waves', url: '/audio/brown_noise.webm' }
];

const GrindSession = ({ session }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionLength = location.state?.length || 90;
  
  const problemQueue = location.state?.problemQueue || [{ title_slug: 'two-sum' }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const problemSlug = problemQueue[currentIndex]?.title_slug;

  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [problemTimeLimit, setProblemTimeLimit] = useState(25);

  useEffect(() => {
    if (problem) {
      const diff = problem.difficulty?.toLowerCase();
      if (diff === 'easy') setProblemTimeLimit(15);
      else if (diff === 'hard') setProblemTimeLimit(45);
      else setProblemTimeLimit(25);
    }
  }, [problem]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(sessionLength * 60);
  const [problemTimeElapsed, setProblemTimeElapsed] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  
  const [pomodoroTimeElapsed, setPomodoroTimeElapsed] = useState(0);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(POMODORO_BREAK);

  // Lo-Fi Player State
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const audioRef = useRef(null);
  
  const [step, setStep] = useState('commit'); 
  const [commitText, setCommitText] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  
  // Evaluation States
  const [evaluating, setEvaluating] = useState(false);
  const [commitFeedback, setCommitFeedback] = useState(null);
  const [reflectionFeedback, setReflectionFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [completedProblems, setCompletedProblems] = useState([]);
  const [showAbortPrompt, setShowAbortPrompt] = useState(false);
  const [showSkipPrompt, setShowSkipPrompt] = useState(false);

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

  // Native Audio Playback Control
  useEffect(() => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Audio playback blocked:", e);
            if (e.name !== 'AbortError') {
              setIsAudioPlaying(false);
            }
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAudioPlaying, currentTrackIndex]);

  // Volume Control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
        // If they used hints or took more than 20 mins, reset interval to 1 day.
        // Otherwise, double the interval.
        const struggled = usedHints > 0 || problemTimeElapsed > 1200;
        const newInterval = struggled ? 1 : existingSr.interval * 2;
        
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
    
      if (currentIndex + 1 < problemQueue.length && sessionTimeLeft > 0) {
      setLoadingProblem(true);
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
      navigate('/summary', { state: { completedProblems, sessionLength } });
    }
  };
  
  const handleSkip = () => {
    setShowSkipPrompt(true);
  };

  const executeSkip = () => {
    setShowSkipPrompt(false);
    if (currentIndex + 1 < problemQueue.length && sessionTimeLeft > 0) {
      setLoadingProblem(true);
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
      navigate('/summary', { state: { completedProblems, sessionLength } });
    }
  };

  const forceBreak = () => {
    setPomodoroTimeElapsed(POMODORO_WORK);
    setIsBreakTime(true);
  };

  const handleAbort = () => {
    setShowAbortPrompt(true);
  };

  const executeAbort = () => {
    setShowAbortPrompt(false);
    navigate('/summary', { state: { completedProblems, sessionLength } });
  };

  // Fix: Check !problem to prevent crashes when transitioning between problems
  if (loadingProblem || !problem) {
    return (
      <motion.div 
        className="grind-container flex items-center justify-center"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
      >
        Loading problem...
      </motion.div>
    );
  }

  // Dynamic problemTimeLimit used instead of hardcoded 30

  return (
    <motion.div 
      className={`grind-container ${isFullscreen ? 'is-fullscreen' : ''}`}
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
    >
      <audio ref={audioRef} src={AUDIO_TRACKS[currentTrackIndex].url} loop />
      
      <header className="grind-header">
        <div className="grind-header-left">
          <div className="brand flex items-center gap-2">
            <span className="text-gradient font-display font-bold">GRINDSET</span>
          </div>
          <div className="vertical-divider hidden-mobile"></div>
          
          <div className="session-timer flex items-center gap-2" title="Total Session Remaining">
            <Clock size={16} /> <span className="timer-label">Session:</span> {formatTime(sessionTimeLeft)}
          </div>
          
          <div className="pomodoro-timer flex items-center gap-2 text-warning" title="Pomodoro Work Time">
            <Coffee size={16} /> <span className="timer-label">Pomo:</span> {formatTime(POMODORO_WORK - pomodoroTimeElapsed)}
          </div>

          <div className={`problem-timer flex items-center gap-2 ${(problemTimeElapsed / 60) > problemTimeLimit ? 'text-error animate-pulse' : ''}`} title="FAANG Recommended Time">
            <span className="timer-label">Prob:</span> {formatTime(problemTimeElapsed)} / 
            <select 
              value={problemTimeLimit}
              onChange={(e) => setProblemTimeLimit(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                padding: '0 4px',
                fontWeight: 'bold'
              }}
            >
              <option value={15} style={{background: 'var(--bg-secondary)', color: 'white'}}>15m (E)</option>
              <option value={25} style={{background: 'var(--bg-secondary)', color: 'white'}}>25m (M)</option>
              <option value={45} style={{background: 'var(--bg-secondary)', color: 'white'}}>45m (H)</option>
              <option value={60} style={{background: 'var(--bg-secondary)', color: 'white'}}>60m (Max)</option>
            </select>
          </div>
        </div>

        <div className="grind-header-right">
          <button className="btn btn-outline text-error" style={{padding: '4px 8px', fontSize: '12px', borderColor: 'var(--error)'}} onClick={handleAbort}>
            Abort Session
          </button>

          <div style={{ position: 'relative' }}>
            <button className={`btn-icon ${isAudioPlaying ? 'text-success' : ''}`} onClick={() => setShowAudioMenu(!showAudioMenu)} title="Ambient Audio Settings">
              {isAudioPlaying ? <Headphones size={20} /> : <Headphones size={20} style={{opacity: 0.5}} />}
            </button>

            <AnimatePresence>
              {showAudioMenu && (
                <motion.div 
                  className="audio-menu glass-panel"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '10px',
                    width: '250px',
                    padding: '16px',
                    zIndex: 100
                  }}
                >
                  <div className="flex justify-between items-center" style={{marginBottom: '12px'}}>
                    <h4 style={{margin: 0}}>Focus Audio</h4>
                    <button 
                      className="btn btn-outline" 
                      style={{padding: '4px 8px', fontSize: '0.8rem'}}
                      onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                    >
                      {isAudioPlaying ? 'Pause' : 'Play'}
                    </button>
                  </div>
                  
                  <div style={{marginBottom: '16px'}}>
                    <div className="flex justify-between text-muted" style={{fontSize: '0.8rem', marginBottom: '4px'}}>
                      <span>Volume</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.05" 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))} 
                      style={{width: '100%', cursor: 'pointer'}}
                    />
                  </div>

                  <div className="flex-col gap-2">
                    {AUDIO_TRACKS.map((track, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentTrackIndex(idx);
                          if (!isAudioPlaying) setIsAudioPlaying(true);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          background: currentTrackIndex === idx ? 'var(--bg-secondary)' : 'transparent',
                          color: currentTrackIndex === idx ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          border: currentTrackIndex === idx ? '1px solid var(--border-subtle)' : '1px solid transparent',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {track.icon === 'flame' && <Flame size={14} />}
                        {track.icon === 'music' && <Music size={14} />}
                        {track.icon === 'cloud-rain' && <CloudRain size={14} />}
                        {track.icon === 'coffee' && <Coffee size={14} />}
                        {track.icon === 'waves' && <Waves size={14} />}
                        {track.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
              <div className="flex items-center gap-4">
                <h2 style={{margin: 0}}>{problem.title}</h2>
                <a 
                  href={`https://leetcode.com/problems/${problemSlug}/`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-outline flex items-center gap-2"
                  style={{ padding: '4px 10px', fontSize: '0.85rem', borderColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)' }}
                >
                  <ExternalLink size={14} /> Solve on LeetCode
                </a>
              </div>
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
                <h3 style={{margin: 0}}>Write Your Approach First</h3>
              </div>
              <p className="text-secondary" style={{marginBottom: '16px'}}>
                Describe your approach and expected time/space complexity. Get it right to unlock the problem.
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
                  <strong>Feedback:</strong> {commitFeedback}
                </div>
              )}

              <button 
                className="btn btn-primary w-full"
                disabled={commitText.length < 10 || evaluating}
                onClick={handleCommitSubmit}
              >
                {evaluating ? 'Checking...' : 'Submit & Start Solving'}
              </button>
              
              <button 
                className="btn btn-outline w-full mt-4"
                style={{borderColor: 'transparent', color: 'var(--text-muted)'}}
                onClick={handleSkip}
                disabled={evaluating}
              >
                Skip Problem
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
                <h3>Hints</h3>
                <span className="text-secondary" style={{fontSize: '0.9rem'}}>Unlock over time. Try without them first.</span>
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

              <div className="completion-action mt-8 flex-col items-center gap-4">
                <button className="btn btn-primary" style={{padding: '16px 32px', fontSize: '1.2rem'}} onClick={submitProblem}>
                  <CheckCircle size={20} /> I've Solved It
                </button>
                <button 
                  className="btn btn-outline"
                  style={{borderColor: 'transparent', color: 'var(--text-muted)', fontSize: '0.9rem'}}
                  onClick={handleSkip}
                >
                  Skip this problem
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
                50 minutes of deep work done. Get up, stretch, look away from the screen.
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
              <p>What was the key insight or pattern? Explain it so the solve counts.</p>
              
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
                  <strong>Feedback:</strong> {reflectionFeedback}
                </div>
              )}
              
              <button 
                className="btn btn-primary w-full mt-4"
                disabled={reflectionText.length < 5 || evaluating || saving}
                onClick={handleReflectionSubmit}
              >
                {evaluating ? 'Verifying...' : saving ? 'Saving...' : 'Confirm & Next Problem '}
                {(!saving && !evaluating) && <ChevronRight size={16} />}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAbortPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel text-center animate-slide-up" style={{ maxWidth: '450px', padding: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', marginBottom: '24px' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Abort Session?</h3>
            <p className="text-gray-400 mb-8" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Progress on completed problems is saved. This ends the session.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-outline" style={{ padding: '12px 24px', fontSize: '1rem', flex: 1 }} onClick={() => setShowAbortPrompt(false)}>
                Keep Grinding
              </button>
              <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', flex: 1, backgroundColor: 'var(--error)', borderColor: 'var(--error)', color: '#fff', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }} onClick={executeAbort}>
                Yes, Abort
              </button>
            </div>
          </div>
        </div>
      )}

      {showSkipPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel text-center animate-slide-up" style={{ maxWidth: '450px', padding: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', color: 'var(--accent-secondary)', marginBottom: '24px' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Skip Problem?</h3>
            <p className="text-gray-400 mb-8" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Nothing gets saved for skipped problems.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-outline" style={{ padding: '12px 24px', fontSize: '1rem', flex: 1 }} onClick={() => setShowSkipPrompt(false)}>
                Go Back
              </button>
              <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', flex: 1, backgroundColor: 'var(--accent-secondary)', borderColor: 'var(--accent-secondary)', color: '#000', boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)' }} onClick={executeSkip}>
                Yes, Skip it
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GrindSession;
