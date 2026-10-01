import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Activity, Target, Flame, Brain, Code, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import './Home.css';

const Home = ({ session }) => {
  const navigate = useNavigate();
  const [sessionLength, setSessionLength] = useState(90);

  const startGrind = () => {
    navigate('/grind', { state: { length: sessionLength } });
  };

  return (
    <div className="home-container container flex-col items-center">
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
            const { supabase } = await import('../supabaseClient');
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
          <Flame size={32} color="var(--accent-primary)" />
          <h1 className="text-gradient">GRINDSET</h1>
        </div>
        <p className="subtitle">Enter the state of extreme focus.</p>
      </motion.header>

      <div className="dashboard-grid">
        <motion.div 
          className="glass-panel stat-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-header">
            <Flame size={20} className="stat-icon" />
            <h3>Current Streak</h3>
          </div>
          <div className="stat-value text-gradient">14 Days</div>
          <div className="stat-sub">Top 5% of grinders</div>
        </motion.div>

        <motion.div 
          className="glass-panel stat-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-header">
            <Brain size={20} className="stat-icon" />
            <h3>Weakness</h3>
          </div>
          <div className="stat-value">Dynamic Prog.</div>
          <div className="stat-sub">24% success rate</div>
        </motion.div>
        
        <motion.div 
          className="glass-panel stat-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-header">
            <Clock size={20} className="stat-icon" />
            <h3>Deep Work</h3>
          </div>
          <div className="stat-value">42h 15m</div>
          <div className="stat-sub">This month</div>
        </motion.div>
      </div>

      <motion.div 
        className="glass-panel launch-panel flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2>Configure Next Session</h2>
        
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
          <div className="feature-item">
            <Target size={16} /> Spaced Repetition Active
          </div>
          <div className="feature-item">
            <Activity size={16} /> Pomodoro (50/10)
          </div>
        </div>

        <button className="btn btn-primary launch-btn animate-pulse-glow" onClick={startGrind}>
          <Play size={20} />
          ENTER GRIND MODE
        </button>
      </motion.div>

      {/* GitHub Style Heatmap Placeholder */}
      <motion.div 
        className="glass-panel heatmap-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3>Consistency Map</h3>
        <div className="heatmap-grid">
          {Array.from({ length: 365 }).map((_, i) => {
            const intensity = Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0;
            return <div key={i} className={`heatmap-cell level-${intensity}`}></div>
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
