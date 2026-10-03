import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Activity, Target, Flame, Brain, Clock, List, ChevronRight, CheckCircle } from '../Icons';
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
  "Graphs": ["Graph", "Breadth-First Search", "Depth-First Search", "Topological Sort"],
  "Advanced Graphs": ["Shortest Path", "Union Find", "Minimum Spanning Tree", "Biconnected Component", "Strongly Connected Component"],
  "1-D Dynamic Programming": ["Dynamic Programming", "Memoization"],
  "2-D Dynamic Programming": ["Dynamic Programming", "Memoization"],
  "Greedy": ["Greedy"],
  "Intervals": ["Intervals", "Line Sweep"],
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
    "DFS / BFS": ["Depth-First Search", "Breadth-First Search", "Graph"],
    "Connected components": ["Depth-First Search", "Breadth-First Search", "Graph"],
    "Grid graphs": ["Graph", "Matrix"],
    "Topological sort": ["Topological Sort"],
    "Union Find / DSU": ["Union Find"],
    "Shortest paths": ["Shortest Path"],
    "Minimum Spanning Tree": ["Minimum Spanning Tree"],
    "Strongly Connected Components": ["Strongly Connected Component"],
    "Advanced graph algorithms": ["Graph"]
  },
  "Advanced Graphs": {
    "Dijkstra": ["Shortest Path"],
    "Bellman-Ford": ["Shortest Path"],
    "Floyd-Warshall": ["Shortest Path"],
    "Prim's / Kruskal's": ["Minimum Spanning Tree"],
    "Union Find": ["Union Find"],
    "Tarjan's algorithm": ["Strongly Connected Component"],
    "Network-flow-type concepts": ["Graph"]
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
    "Sweep-line ideas": ["Line Sweep"]
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
      filtered = allProblems.filter(p => p.topic_tags?.some(tag => targetTags.includes(tag)));
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
      reviewQueue = reviewQueue.filter(p => p.topic_tags?.some(tag => targetTags.includes(tag)));
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
        <p className="subtitle">Leetcode grind with forced reflection, spaced repetition, and zero tab-switching.</p>
      </motion.header>

      <div className="dashboard-grid">
        <motion.div className="glass-panel stat-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-header"><Flame size={20} className="stat-icon" /><h3>Streak</h3></div>
          <div className="stat-value text-gradient">{stats.streak} Days</div>
          <div className="stat-sub">{stats.streak > 0 ? "Don't break it." : "Day zero. Fix that."}</div>
        </motion.div>

        <motion.div className="glass-panel stat-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-header"><Brain size={20} className="stat-icon" /><h3>Weakness</h3></div>
          <div className="stat-value">{stats.weakness}</div>
          <div className="stat-sub">{stats.weaknessStat}</div>
        </motion.div>
        
        <motion.div className="glass-panel stat-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-header"><Clock size={20} className="stat-icon" /><h3>Deep Work</h3></div>
          <div className="stat-value">{stats.deepWork}</div>
          <div className="stat-sub">Total focused time</div>
        </motion.div>
      </div>

      <motion.div 
        className="glass-panel launch-panel flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2>Configure Next Session</h2>
        
        <div className="flex-col w-full text-left" style={{maxWidth: '800px'}}>
          <label className="text-secondary flex items-center gap-2" style={{marginBottom: '12px'}}>
            <List size={16} /> Topic Filter
          </label>
          
          <div className="flex gap-4" style={{marginBottom: '20px', flexWrap: 'wrap'}}>
            {[
              { id: 'mixed', label: 'Mixed Topics' },
              { id: 'topic', label: 'Topic Wise' },
              { id: 'subtopic', label: 'Subtopic Wise' }
            ].map(mode => (
              <button 
                key={mode.id} 
                className={`btn ${selectionMode === mode.id ? 'btn-primary' : 'btn-outline'}`}
                style={{textTransform: 'uppercase', fontSize: '0.85rem', flex: 1, minWidth: '150px'}}
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

          {selectionMode === 'topic' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', width: '100%', marginBottom: '24px' }}>
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
             <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '24px', alignItems: 'flex-start', minHeight: '300px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
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
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1.5, maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
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

      <div className="bottom-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%', maxWidth: '1200px', marginTop: '24px' }}>
        <motion.div className="glass-panel heatmap-panel" style={{ width: '100%', margin: 0 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="heatmap-panel-header">
            <h3>Consistency Map</h3>
            <span className="heatmap-total-badge">
              {Object.values(heatmapData).reduce((a, b) => a + b, 0)} submissions
            </span>
          </div>
          <div className="heatmap-wrapper">
            <div className="heatmap-months">
              {getMonths().map((m, i) => <span key={i}>{m}</span>)}
            </div>
            <div className="heatmap-body">
              <div className="heatmap-day-labels">
                <span></span>
                <span>Mon</span>
                <span></span>
                <span>Wed</span>
                <span></span>
                <span>Fri</span>
                <span></span>
              </div>
              <div className="heatmap-grid">
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
            </div>
            <div className="heatmap-legend">
              <span>Less</span>
              <div className="heatmap-legend-cell" style={{background: 'var(--bg-tertiary)'}}></div>
              <div className="heatmap-legend-cell" style={{background: 'rgba(255, 46, 84, 0.25)'}}></div>
              <div className="heatmap-legend-cell" style={{background: 'rgba(255, 46, 84, 0.5)'}}></div>
              <div className="heatmap-legend-cell" style={{background: 'rgba(255, 46, 84, 0.75)'}}></div>
              <div className="heatmap-legend-cell" style={{background: '#FF2E54'}}></div>
              <span>More</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="glass-panel history-panel" style={{ width: '100%' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="history-panel-header">
            <h3>Solved History</h3>
            {pendingReviewsCount > 0 && (
              <span className="history-due-badge">
                <span className="history-due-dot"></span>
                {pendingReviewsCount} due for review
              </span>
            )}
          </div>
          
          <div className="history-list">
            {solvedHistory.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">
                  <Target size={24} />
                </div>
                <span>No problems solved yet.</span>
                <span style={{fontSize: '0.8rem'}}>Start a session to build your history!</span>
              </div>
            ) : (
              solvedHistory.map((record, i) => {
                const diff = record.difficulty?.toLowerCase() || 'medium';
                const mins = Math.floor((record.time_taken_seconds || 0) / 60);
                const secs = (record.time_taken_seconds || 0) % 60;
                return (
                  <div key={i} className="history-item">
                    <div className="history-item-left">
                      <div className={`history-item-icon ${diff}`}>
                        <CheckCircle size={14} />
                      </div>
                      <span className="history-item-title">{record.title}</span>
                    </div>
                    <div className="history-item-meta">
                      {record.difficulty && (
                        <span className={`history-item-difficulty ${diff}`}>{record.difficulty}</span>
                      )}
                      <span className="history-item-time">{mins}:{secs.toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="history-cta">
             <button 
               className={`btn history-cta-btn ${pendingReviewsCount > 0 ? 'btn-primary animate-pulse-glow' : 'all-caught-up'}`}
               onClick={startSpacedSolving}
               disabled={loading || pendingReviewsCount === 0}
             >
               <Brain size={18} />
               {pendingReviewsCount > 0 ? `START SPACED REVIEW (${pendingReviewsCount})` : '✓ ALL CAUGHT UP'}
             </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
