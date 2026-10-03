import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Activity, Flame, CheckCircle, Clock, Award } from '../Icons';
import './Summary.css';

const Summary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completedProblems = [], sessionLength = 0 } = location.state || {};

  const totalTimeSpent = completedProblems.reduce((acc, p) => acc + p.time, 0);
  const totalHints = completedProblems.reduce((acc, p) => acc + p.hints, 0);
  const flawlessCount = completedProblems.filter(p => p.hints === 0).length;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="summary-container"
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
    >
      <motion.div className="summary-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-gradient">Grind Complete</h1>
        <p>Session done. Here's the breakdown.</p>
      </motion.div>

      <motion.div 
        className="summary-stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="summary-stat-card" variants={itemVariants}>
          <div className="stat-label flex items-center justify-center gap-2"><Target size={16} /> Problems Solved</div>
          <div className="stat-value-large">{completedProblems.length}</div>
        </motion.div>
        
        <motion.div className="summary-stat-card" variants={itemVariants}>
          <div className="stat-label flex items-center justify-center gap-2"><Clock size={16} /> Time Spent</div>
          <div className="stat-value-large" style={{ color: 'var(--accent-secondary)' }}>{formatTime(totalTimeSpent)}</div>
        </motion.div>

        <motion.div className="summary-stat-card" variants={itemVariants}>
          <div className="stat-label flex items-center justify-center gap-2"><Award size={16} /> Flawless Solves</div>
          <div className="stat-value-large" style={{ color: 'var(--success)' }}>{flawlessCount}</div>
        </motion.div>
      </motion.div>

      {completedProblems.length > 0 && (
        <motion.div 
          className="glass-panel combat-log-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2><Activity size={24} style={{ color: 'var(--accent-primary)' }}/> Session Log</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {completedProblems.map((p, idx) => (
              <div key={idx} className="combat-item">
                <div className="combat-title">
                  <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                  {p.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </div>
                
                <div className="combat-metrics">
                  <div className="combat-metric">
                    <span className="metric-label">Time</span>
                    <span className="metric-value">{formatTime(p.time)}</span>
                  </div>
                  <div className="combat-metric">
                    <span className="metric-label">Hints Used</span>
                    <span className={`metric-value ${p.hints === 0 ? 'flawless' : 'warn'}`}>
                      {p.hints === 0 ? 'None' : p.hints}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div 
        style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      >
        <button 
          onClick={() => navigate('/')}
          className="btn btn-primary"
          style={{ padding: '16px 48px', fontSize: '1.1rem', letterSpacing: '0.05em' }}
        >
          Return to Dashboard
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Summary;
