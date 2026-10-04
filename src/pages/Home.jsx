import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Activity, Target, Flame, Brain, Clock, List, ChevronRight, CheckCircle } from '../Icons';
import { Zap, RefreshCcw, RefreshCw, ShieldCheck, ShieldAlert, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAllProblems } from '../api';
import { supabase } from '../supabaseClient';
import './Home.css';

const NEETCODE_TOPICS = {
  "Arrays & Hashing": ["Array", "Hash Table", "String", "Prefix Sum", "Counting"],
  "Two Pointers": ["Two Pointers"],
  "Sliding Window": ["Sliding Window"],
  "Stack": ["Stack", "Monotonic Stack"],
  "Binary Search": ["Binary Search"],
  "Linked List": ["Linked List"],
  "Trees": ["Tree", "Binary Tree", "Binary Search Tree"],
  "Tries": ["Trie"],
  "Heap / Priority Queue": ["Heap (Priority Queue)"],
  "Backtracking": ["Backtracking"],
  "Graphs": ["Graph Theory"],
  "Advanced Graphs": ["Shortest Path", "Union-Find", "Minimum Spanning Tree", "Biconnected Component", "Strongly Connected Component"],
  "1-D Dynamic Programming": ["Dynamic Programming", "Memoization"],
  "2-D Dynamic Programming": ["Dynamic Programming", "Memoization"],
  "Greedy": ["Greedy"],
  "Intervals": ["Sweep Line", "Array", "Sorting"],
  "Math & Geometry": ["Math", "Geometry", "Number Theory", "Game Theory"],
  "Bit Manipulation": ["Bit Manipulation"]
};

const NEETCODE_SUBTOPICS = {
  "Arrays & Hashing": {
    "Arrays": ["Array"],
    "Hash maps / sets": ["Hash Table"],
    "Prefix sums": ["Prefix Sum"],
    "Counting / frequency": ["Counting"],
    "Kadane's Algorithm": ["Dynamic Programming", "Array"]
  },
  "Two Pointers": {
    "Opposite-direction pointers": ["Two Pointers"],
    "Same-direction pointers": ["Two Pointers"],
    "Sorted-array techniques": ["Two Pointers", "Sorting"]
  },
  "Sliding Window": {
    "Fixed-size window": ["Sliding Window"],
    "Variable-size window": ["Sliding Window"],
    "Frequency/count windows": ["Sliding Window", "Hash Table"]
  },
  "Stack": {
    "Monotonic stack": ["Monotonic Stack"],
    "Parentheses problems": ["Stack", "String"],
    "Expression problems": ["Stack", "Math"]
  },
  "Binary Search": {
    "Classic binary search": ["Binary Search"],
    "Search on answer": ["Binary Search"],
    "Rotated arrays": ["Binary Search", "Array"],
    "2D binary search": ["Binary Search", "Matrix"]
  },
  "Linked List": {
    "Fast & slow pointers": ["Linked List", "Two Pointers"],
    "Reversal": ["Linked List"],
    "Merging": ["Linked List", "Divide and Conquer"],
    "Cycle detection": ["Linked List", "Two Pointers"],
    "Linked-list manipulation": ["Linked List"]
  },
  "Trees": {
    "Binary trees": ["Binary Tree"],
    "BST": ["Binary Search Tree"],
    "DFS": ["Depth-First Search", "Tree"],
    "BFS / level order": ["Breadth-First Search", "Tree"],
    "Tree construction": ["Tree", "Array"],
    "Lowest Common Ancestor": ["Tree", "Depth-First Search"]
  },
  "Tries": {
    "Prefix trees": ["Trie"],
    "Word search": ["Trie", "Backtracking"],
    "Prefix matching": ["Trie", "String"]
  },
  "Heap / Priority Queue": {
    "Min/max heap": ["Heap (Priority Queue)"],
    "Top K": ["Heap (Priority Queue)", "Sorting"],
    "K-way merge": ["Heap (Priority Queue)", "Linked List"],
    "Two heaps": ["Heap (Priority Queue)"]
  },
  "Backtracking": {
    "Subsets": ["Backtracking", "Array"],
    "Permutations": ["Backtracking", "Math"],
    "Combination problems": ["Backtracking"],
    "Constraint-based search": ["Backtracking"]
  },
  "Graphs": {
    "DFS / BFS": ["Depth-First Search", "Breadth-First Search", "Graph Theory"],
    "Connected components": ["Depth-First Search", "Breadth-First Search", "Graph Theory"],
    "Grid graphs": ["Graph Theory", "Matrix"],
    "Topological sort": ["Topological Sort"],
    "Union Find / DSU": ["Union-Find"],
    "Shortest paths": ["Shortest Path"],
    "Minimum Spanning Tree": ["Minimum Spanning Tree"],
    "Strongly Connected Components": ["Strongly Connected Component"],
    "Advanced graph algorithms": ["Graph Theory"]
  },
  "Advanced Graphs": {
    "Dijkstra": ["Shortest Path"],
    "Bellman-Ford": ["Shortest Path"],
    "Floyd-Warshall": ["Shortest Path"],
    "Prim's / Kruskal's": ["Minimum Spanning Tree"],
    "Union Find": ["Union-Find"],
    "Tarjan's algorithm": ["Strongly Connected Component"],
    "Network-flow-type concepts": ["Graph Theory"]
  },
  "1-D Dynamic Programming": {
    "Fibonacci-style DP": ["Dynamic Programming"],
    "House Robber": ["Dynamic Programming"],
    "Kadane": ["Dynamic Programming", "Array"],
    "Decision/choice DP": ["Dynamic Programming"],
    "State-based DP": ["Dynamic Programming"]
  },
  "2-D Dynamic Programming": {
    "Grid DP": ["Dynamic Programming", "Matrix"],
    "Knapsack": ["Dynamic Programming"],
    "LCS": ["Dynamic Programming", "String"],
    "Edit Distance": ["Dynamic Programming", "String"],
    "Subsequence DP": ["Dynamic Programming"]
  },
  "Greedy": {
    "Interval problems": ["Greedy", "Sorting"],
    "Scheduling": ["Greedy", "Sorting"],
    "Local-optimum strategies": ["Greedy"]
  },
  "Intervals": {
    "Merge intervals": ["Array", "Sorting"],
    "Overlapping intervals": ["Array", "Sorting"],
    "Meeting rooms": ["Array", "Sorting"],
    "Sweep-line ideas": ["Sweep Line"]
  },
  "Math & Geometry": {
    "Number theory": ["Math", "Number Theory"],
    "Matrix manipulation": ["Math", "Matrix"],
    "Geometry": ["Geometry"],
    "Modular arithmetic": ["Math"]
  },
  "Bit Manipulation": {
    "AND / OR / XOR": ["Bit Manipulation"],
    "Bit masks": ["Bit Manipulation", "Bitmask"],
    "Shifts": ["Bit Manipulation"],
    "Counting bits": ["Bit Manipulation"],
    "XOR tricks": ["Bit Manipulation"]
  }
};

const Home = ({ session }) => {
  const navigate = useNavigate();
  const [sessionLength, setSessionLength] = useState(90);
  const [allProblems, setAllProblems] = useState([]);
  const [selectionMode, setSelectionMode] = useState('mixed');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState({});
  const [solvedHistory, setSolvedHistory] = useState([]);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
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
        // Topics are now handled by NEETCODE_TOPICS and NEETCODE_SUBTOPICS constants
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
          .gte('created_at', oneYearAgo.toISOString())
          .order('created_at', { ascending: false });
          
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

          // History Panel
          const solvedRecords = data.filter(r => r.status === 'solved');
          const recentSolvedWithTitles = solvedRecords.slice(0, 50).map(r => {
             const p = problems.find(p => p.title_slug === r.problem_slug);
             return { 
               ...r, 
               title: p ? p.title : r.problem_slug,
               difficulty: p ? p.difficulty : null
             };
          });
          setSolvedHistory(recentSolvedWithTitles);

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

        const today = new Date().toISOString();
        const { count } = await supabase
          .from('spaced_repetition')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .lte('next_review_date', today);
        setPendingReviewsCount(count || 0);
      }
      
      setLoading(false);
    };

    initDashboard();
  }, [session]);

  const startSpacedSolving = async () => {
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
    
    let reviewQueue = reviewSlugs
      .map(slug => allProblems.find(p => p.title_slug === slug))
      .filter(p => !!p);

    // Shuffle
    for (let i = reviewQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reviewQueue[i], reviewQueue[j]] = [reviewQueue[j], reviewQueue[i]];
    }

    setLoading(false);
    navigate('/grind', { 
      state: { 
        length: sessionLength,
        problemQueue: reviewQueue.slice(0, 50) 
      } 
    });
  };

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
    let targetTags = [];
    
    if (selectionMode === 'topic' && selectedTopic) {
      targetTags = NEETCODE_TOPICS[selectedTopic];
    } else if (selectionMode === 'subtopic' && selectedTopic && selectedSubtopic) {
      targetTags = NEETCODE_SUBTOPICS[selectedTopic][selectedSubtopic] || [];
    }

    // overrideTopic is used by "Target Weakness", which provides a direct tag name
    if (overrideTopic && overrideTopic !== 'None') {
      targetTags = [overrideTopic];
    }

    if (targetTags && targetTags.length > 0) {
      if (selectionMode === 'subtopic' && !overrideTopic) {
        filtered = allProblems.filter(p => targetTags.every(tag => p.topic_tags?.includes(tag)));
      } else {
        filtered = allProblems.filter(p => p.topic_tags?.some(tag => targetTags.includes(tag)));
      }
    }
    
    filtered = filtered.filter(p => !p.paid_only);
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    const randomPool = filtered.filter(p => !reviewSlugs.includes(p.title_slug)).slice(0, 100);

    const shuffled = [...randomPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let reviewQueue = reviewSlugs
      .map(slug => allProblems.find(p => p.title_slug === slug))
      .filter(p => !!p);

    if (targetTags && targetTags.length > 0) {
      if (selectionMode === 'subtopic' && !overrideTopic) {
        reviewQueue = reviewQueue.filter(p => targetTags.every(tag => p.topic_tags?.includes(tag)));
      } else {
        reviewQueue = reviewQueue.filter(p => p.topic_tags?.some(tag => targetTags.includes(tag)));
      }
    }

    for (let i = reviewQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reviewQueue[i], reviewQueue[j]] = [reviewQueue[j], reviewQueue[i]];
    }

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
      className="home-container"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="top-bar-intense">
        <div className="user-profile-badge">
          <div className="avatar-wrapper">
             <img src={session?.user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Grinder"} alt="User Profile" referrerPolicy="no-referrer" />
          </div>
          <div className="user-status-text">
            <span className="pilot-status">Pilot Status</span>
            <span className="elite-grinder">{session?.user?.user_metadata?.full_name || "Elite Grindr"}</span>
          </div>
        </div>
        <button className="btn-terminal-exit" onClick={async () => { await supabase.auth.signOut(); }}>
          Terminal Exit
        </button>
      </div>

      <header className="header-intense">
        <div className="logo-group">
          <img src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/projects/d33af359-880b-4ce4-bc68-61b545dc2f04/brand-assets/logo.png/logo.png" alt="Grindset Logo" className="logo-img" />
          <h1 className="logo-text">GRINDSET</h1>
        </div>
        <div className="protocol-bar">
          <span className="protocol-line"></span>LEETCODE REFLECTION PROTOCOL<span className="protocol-line"></span>
        </div>
      </header>

      <div className="stats-grid-intense">
        <motion.div className="glass-panel stat-card-intense" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-header-intense">
            <div className="stat-title"><Flame className="icon-accent" size={24} /><h3>Streak</h3></div>
            <span className="sec-tag">SEC-01</span>
          </div>
          <div className="stat-value-intense tabular">{stats.streak} <span className="unit">Days</span></div>
          <div className="progress-bar-bg"><div className="progress-bar-fill" style={{width: `${Math.min(stats.streak * 5, 100)}%`}}></div></div>
        </motion.div>

        <motion.div className="glass-panel stat-card-intense" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-header-intense">
            <div className="stat-title"><Brain className="icon-accent" size={24} /><h3>Weakness</h3></div>
            <span className="sec-tag">SEC-02</span>
          </div>
          <div className="stat-value-intense" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>{stats.weakness}</div>
          <div className="stat-sub-intense error-text">{stats.weaknessStat}</div>
        </motion.div>
        
        <motion.div className="glass-panel stat-card-intense" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-header-intense">
            <div className="stat-title"><Clock className="icon-accent" size={24} /><h3>Focus Time</h3></div>
            <span className="sec-tag">SEC-03</span>
          </div>
          <div className="stat-value-intense tabular" dangerouslySetInnerHTML={{ __html: stats.deepWork.replace('h', '<span class="unit">h</span>').replace('m', '<span class="unit">m</span>') }}></div>
          <div className="stat-sub-intense italic-text">Synchronizing with deep work engine...</div>
        </motion.div>
      </div>

      <motion.div className="glass-panel launch-panel-intense" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
        <div className="glow-line"></div>
        <h2>Mission Config</h2>
        
        <div className="config-section">
          <div className="config-header">
            <span className="config-label">Target Selection</span>
            <span className="config-status">READY_TO_DEPLOY</span>
          </div>
          
          <div className="mode-buttons">
            {[
              { id: 'mixed', label: 'Mixed-Ops' },
              { id: 'topic', label: 'Topic-Focus' },
              { id: 'subtopic', label: 'Sub-Target' }
            ].map(mode => (
              <button 
                key={mode.id} 
                className={`btn-mode-intense ${selectionMode === mode.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectionMode(mode.id);
                  if (mode.id === 'topic' || mode.id === 'subtopic') {
                    if (!selectedTopic) setSelectedTopic('Arrays & Hashing');
                  }
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {selectionMode === 'topic' && (
          <div className="topic-grid">
            {Object.keys(NEETCODE_TOPICS).map((topic) => (
              <motion.div
                key={topic}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${selectedTopic === topic ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: selectedTopic === topic ? 'var(--bg-secondary)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: selectedTopic === topic ? 'bold' : 'normal', color: selectedTopic === topic ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{topic}</span>
                {selectedTopic === topic && (
                  <motion.div layoutId="activeTopicDot" style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)'}} />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {selectionMode === 'subtopic' && (
           <div className="subtopic-container">
             <div className="subtopic-column" style={{ flex: 1 }}>
               {Object.keys(NEETCODE_SUBTOPICS).map(topic => (
                 <div 
                   key={topic}
                   onClick={() => {
                     setSelectedTopic(topic);
                     const subs = Object.keys(NEETCODE_SUBTOPICS[topic]);
                     if (subs.length > 0) setSelectedSubtopic(subs[0]);
                   }}
                   style={{
                     padding: '12px', cursor: 'pointer', borderRadius: '4px',
                     background: selectedTopic === topic ? 'var(--bg-secondary)' : 'transparent',
                     borderLeft: selectedTopic === topic ? '3px solid var(--accent-primary)' : '3px solid transparent',
                     fontSize: '0.9rem', color: selectedTopic === topic ? 'var(--text-primary)' : 'var(--text-secondary)',
                     fontWeight: selectedTopic === topic ? 'bold' : 'normal',
                     transition: 'all 0.2s'
                   }}
                 >
                   {topic}
                 </div>
               ))}
             </div>
             <div className="subtopic-column" style={{ flex: 1.5 }}>
               {selectedTopic && NEETCODE_SUBTOPICS[selectedTopic] && Object.keys(NEETCODE_SUBTOPICS[selectedTopic]).map(sub => (
                 <motion.div
                   key={sub}
                   onClick={() => setSelectedSubtopic(sub)}
                   style={{
                     padding: '12px', cursor: 'pointer', borderRadius: '4px',
                     border: `1px solid ${selectedSubtopic === sub ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                     background: selectedSubtopic === sub ? 'rgba(0, 214, 178, 0.1)' : 'transparent',
                     color: selectedSubtopic === sub ? 'var(--accent-primary)' : 'var(--text-secondary)',
                     fontSize: '0.9rem',
                     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                     transition: 'all 0.2s'
                   }}
                 >
                   {sub}
                   {selectedSubtopic === sub && <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)'}} />}
                 </motion.div>
               ))}
             </div>
           </div>
        )}
        
        <div className="duration-section">
          <span className="config-label center">Session Duration</span>
          <div className="duration-selector-intense">
            {[60, 90, 120].map(time => (
              <button 
                key={time}
                className={`btn-duration-intense ${sessionLength === time ? 'active' : ''}`}
                onClick={() => setSessionLength(time)}
              >
                {time}M
              </button>
            ))}
          </div>
        </div>

        <div className="launch-action-area">
          <button 
            className="btn-grind-mode animate-pulse-glow" 
            onClick={() => startGrind()}
            disabled={loading}
          >
            <Zap size={24} /> {loading ? 'SYNCING...' : 'ENGAGE GRIND MODE'}
          </button>
          
          <div className="session-flags">
            <div className="flag"><RefreshCcw className="icon-primary" size={14}/> Spaced Logic Active</div>
            <div className="flag"><Flame className="icon-primary" size={14}/> Pomodoro Sync 50:10</div>
          </div>
        </div>
      </motion.div>

      <div className="bottom-grid-intense">
        <motion.div className="glass-panel radar-panel terminal-grid" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <div className="panel-header-intense">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3>Consistency Radar</h3>
              <span className="scanning-text">SCANNING_HISTORY_LOGS...</span>
            </div>
            <div className="radar-badge">
              {Object.values(heatmapData).reduce((a, b) => a + b, 0)} ENTRIES
            </div>
          </div>
          
          <div className="radar-map-wrapper">
            <div className="radar-map-inner">
              <div className="heatmap-months">
                {getMonths().map((m, i) => <span key={i}>{m}</span>)}
              </div>
              <div className="radar-grid-bg">
                {Array.from({ length: 364 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (363 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  const count = heatmapData[dateStr] || 0;
                  
                  let intensity = 0;
                  if (count >= 1 && count <= 1) intensity = 1;
                  else if (count >= 2 && count <= 3) intensity = 2;
                  else if (count >= 4 && count <= 6) intensity = 3;
                  else if (count > 6) intensity = 4;

                  return <div key={i} className={`heatmap-cell level-${intensity}`} title={`${count} problems on ${dateStr}`}></div>
                })}
              </div>
              
              <div className="heatmap-legend">
                <span>MIN</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div className="heatmap-cell"></div>
                  <div className="heatmap-cell level-1"></div>
                  <div className="heatmap-cell level-2"></div>
                  <div className="heatmap-cell level-3"></div>
                  <div className="heatmap-cell level-4"></div>
                </div>
                <span>MAX</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className="glass-panel history-panel-intense" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <div className="panel-header-intense">
            <h3>Solved History</h3>
            {pendingReviewsCount > 0 && (
              <div className="history-due-badge-intense">
                <div className="history-due-dot"></div>
                {pendingReviewsCount} CRITICAL REVIEWS
              </div>
            )}
          </div>
          
          <div className="history-list-intense">
            {solvedHistory.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#71717a', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                No history logs detected
              </div>
            ) : (
              solvedHistory.map((record, i) => {
                const diff = record.difficulty?.toLowerCase() || 'medium';
                const mins = Math.floor((record.time_taken_seconds || 0) / 60);
                const secs = ((record.time_taken_seconds || 0) % 60).toString().padStart(2, '0');
                
                let Icon = ShieldCheck;
                let statusLabel = "Secure";
                if (diff === 'medium') { Icon = ShieldAlert; statusLabel = "Warning"; }
                if (diff === 'hard') { Icon = Skull; statusLabel = "Danger"; }
                
                return (
                  <div key={i} className={`history-item-intense ${diff}`}>
                    <div className="history-left">
                      <div className={`history-icon-box ${diff}`}>
                        <Icon size={20} />
                      </div>
                      <div className="history-info">
                        <span className="title">{record.title}</span>
                        <span className="vector-id">Vector ID: {Math.random().toString(36).substring(2, 5)}</span>
                      </div>
                    </div>
                    <div className="history-right">
                      <span className={`history-tag ${diff}`}>{statusLabel}</span>
                      <span className="history-time">{mins}:{secs}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {pendingReviewsCount > 0 && (
            <div style={{ paddingTop: '16px' }}>
               <button 
                 className="btn-spaced-review"
                 onClick={startSpacedSolving}
                 disabled={loading}
               >
                 <RefreshCw size={20} />
                 Initiate Spaced Review Protocol ({pendingReviewsCount})
               </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;