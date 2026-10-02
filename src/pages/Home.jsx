import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Activity, Target, Flame, Brain, Clock, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchAllProblems } from '../api';
import { supabase } from '../supabaseClient';
import './Home.css';

const Home = ({ session }) => {
  const navigate = useNavigate();
  const [sessionLength, setSessionLength] = useState(90);
  const [allProblems, setAllProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('Mixed');
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState({});
  const [weaknessTopic, setWeaknessTopic] = useState('None');
  const [stats, setStats] = useState({
    streak: 0,
    deepWork: "0h 0m",
    weakness: "None",
    weaknessStat: "0 hints"
  });

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      
      // 1. Fetch Problems API
      let problems = [];
      try {
        problems = await fetchAllProblems();
        setAllProblems(problems);
        
        const topicSet = new Set();
        problems.forEach(p => {
          if (p.topic_tags) {
            p.topic_tags.forEach(tag => topicSet.add(tag));
          }
        });
        
        const sortedTopics = Array.from(topicSet).sort();
        setTopics(['Mixed', ...sortedTopics]);
      } catch (err) {
        console.error("Error fetching problems:", err);
      }

      // 2. Fetch Database Stats
      if (session?.user?.id) {
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        
        const { data, error } = await supabase
          .from('problem_history')
          .select('created_at, status, time_taken_seconds, hints_used, problem_slug')
          .eq('user_id', session.user.id)
          .gte('created_at', oneYearAgo.toISOString());
          
        if (!error && data) {
          const counts = {};
          let totalSeconds = 0;
          const topicHints = {};

          data.forEach(record => {
            if (record.status !== 'solved') return;
            
            // Heatmap
            const date = new Date(record.created_at).toISOString().split('T')[0];
            counts[date] = (counts[date] || 0) + 1;
            
            // Deep Work
            totalSeconds += (record.time_taken_seconds || 0);
            
            // Weakness (Topic with most hints used)
            if (record.hints_used > 0) {
              const problem = problems.find(p => p.title_slug === record.problem_slug);
              if (problem && problem.topic_tags) {
                problem.topic_tags.forEach(tag => {
                  topicHints[tag] = (topicHints[tag] || 0) + record.hints_used;
                });
              }
            }
          });

          setHeatmapData(counts);

          // Calculate Streak
          let currentStreak = 0;
          const today = new Date();
          for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            if (counts[dateStr] > 0) {
              currentStreak++;
            } else if (i === 0) {
              // Missed today so far, that's fine, check yesterday
              continue;
            } else {
              break; // Streak broken
            }
          }

          // Format Deep Work
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);

          // Determine Weakness
          let weakestTopic = "None";
          let maxHints = 0;
          for (const [topic, hints] of Object.entries(topicHints)) {
            if (hints > maxHints) {
              maxHints = hints;
              weakestTopic = topic;
            }
          }
          
          setWeaknessTopic(weakestTopic);

          setStats({
            streak: currentStreak,
            deepWork: `${hours}h ${minutes}m`,
            weakness: weakestTopic.length > 13 ? weakestTopic.substring(0, 10) + '...' : weakestTopic,
            weaknessStat: maxHints > 0 ? `${maxHints} hints used` : "0 hints"
          });
        }
      }
      
      setLoading(false);
    };

    initDashboard();
  }, [session]);

  const startGrind = async (overrideTopic = null) => {
    setLoading(true);
    let reviewSlugs = [];

    if (session?.user?.id) {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from('spaced_repetition')
        .select('problem_slug')
        .eq('user_id', session.user.id)
        .lte('next_review_date', today);
      
      if (!error && data) {
        reviewSlugs = data.map(row => row.problem_slug);
      }
    }

    let filtered = allProblems;
    const targetTopic = overrideTopic || selectedTopic;
    if (targetTopic !== 'Mixed') {
      filtered = allProblems.filter(p => p.topic_tags?.includes(targetTopic));
    }
    
    filtered = filtered.filter(p => !p.paid_only);
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    const randomPool = filtered.filter(p => !reviewSlugs.includes(p.title_slug)).slice(0, 100);

    const shuffled = [...randomPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const reviewQueue = reviewSlugs
      .map(slug => allProblems.find(p => p.title_slug === slug))
      .filter(p => !!p);

    const finalQueue = [...reviewQueue, ...shuffled].slice(0, 50);

    setLoading(false);
    navigate('/grind', { 
      state: { 
        length: sessionLength,
        problemQueue: finalQueue 
      } 
    });
  };

  const getMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }
    return months;
  };

  return (
    <motion.div 
      className="home-container container flex-col items-center"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: '10px'}}>
        {session?.user?.user_metadata?.avatar_url && (
          <img 
            src={session.user.user_metadata.avatar_url} 
            alt="Profile" 
            referrerPolicy="no-referrer"
            style={{width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-primary)', objectFit: 'cover'}}
          />
        )}
        <button 
          className="btn btn-outline" 
          style={{padding: '6px 12px', fontSize: '12px'}}
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          Sign Out
        </button>
      </div>

      <motion.header 
        className="home-header flex-col items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="logo flex items-center gap-2">
          <img src="/logo.png" alt="Grindset Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
          <h1 className="text-gradient">GRINDSET</h1>
        </div>
        <p className="subtitle">Forge your intuition. Crush FAANG interviews. No distractions.</p>
      </motion.header>

      <div className="dashboard-grid">
        <motion.div className="glass-panel stat-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-header"><Flame size={20} className="stat-icon" /><h3>Current Streak</h3></div>
          <div className="stat-value text-gradient">{stats.streak} Days</div>
          <div className="stat-sub">{stats.streak > 0 ? "Keep it burning!" : "Start grinding today"}</div>
        </motion.div>

        <motion.div className="glass-panel stat-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-header"><Brain size={20} className="stat-icon" /><h3>Weakness</h3></div>
          <div className="stat-value">{stats.weakness}</div>
          <div className="stat-sub">{stats.weaknessStat}</div>
        </motion.div>
        
        <motion.div className="glass-panel stat-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-header"><Clock size={20} className="stat-icon" /><h3>Deep Work</h3></div>
          <div className="stat-value">{stats.deepWork}</div>
          <div className="stat-sub">All time focused</div>
        </motion.div>
      </div>

      <motion.div 
        className="glass-panel launch-panel flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2>Configure Next Session</h2>
        
        <div className="flex-col w-full gap-2 text-left" style={{maxWidth: '400px'}}>
          <label className="text-secondary flex items-center gap-2">
            <List size={16} /> Select Topic to Master
          </label>
          <select 
            className="topic-select"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            disabled={loading}
          >
            {loading ? (
              <option>Loading Topics...</option>
            ) : (
              topics.map(t => <option key={t} value={t}>{t}</option>)
            )}
          </select>
        </div>
        
        <div className="duration-selector flex gap-4">
          {[60, 90, 120].map(time => (
            <button 
              key={time}
              className={`duration-btn ${sessionLength === time ? 'active' : ''}`}
              onClick={() => setSessionLength(time)}
            >
              {time} MIN
            </button>
          ))}
        </div>

        <div className="session-features flex gap-6">
          <div className="feature-item"><Target size={16} /> Spaced Repetition Active</div>
          <div className="feature-item"><Activity size={16} /> Pomodoro (50/10)</div>
        </div>

        <div className="flex gap-4">
          <button 
            className="btn btn-primary launch-btn animate-pulse-glow" 
            onClick={() => startGrind()}
            disabled={loading}
          >
            <Play size={20} />
            {loading ? 'SYNCING...' : 'ENTER GRIND MODE'}
          </button>
          
          {weaknessTopic !== 'None' && (
            <button 
              className="btn btn-outline launch-btn" 
              style={{ borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }}
              onClick={() => startGrind(weaknessTopic)} 
              disabled={loading}
            >
              <Brain size={20} />
              TARGET WEAKNESS
            </button>
          )}
        </div>
      </motion.div>

      <motion.div className="glass-panel heatmap-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3>Consistency Map</h3>
        <div className="heatmap-wrapper">
          <div className="heatmap-months">
            {getMonths().map((m, i) => <span key={i}>{m}</span>)}
          </div>
          <div className="heatmap-grid">
            {Array.from({ length: 364 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (363 - i));
              const dateStr = date.toISOString().split('T')[0];
              const count = heatmapData[dateStr] || 0;
              
              let intensity = 0;
              if (count > 0 && count <= 1) intensity = 1;
              else if (count > 1 && count <= 3) intensity = 2;
              else if (count > 3 && count <= 6) intensity = 3;
              else if (count > 6) intensity = 4;

              return <div key={i} className={`heatmap-cell level-${intensity}`} title={`${count} problems solved on ${dateStr}`}></div>
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Home;
