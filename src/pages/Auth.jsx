import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import './Auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the login link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // User is logged in, App.jsx should re-render based on session
      }
    } catch (error) {
      setMessage(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <motion.div 
      className="auth-container flex-col items-center justify-center"
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
    >
      <div className="auth-card glass-panel flex-col items-center">
        <div className="logo flex flex-col items-center gap-2" style={{marginBottom: '24px'}}>
          <img src="/logo.png" alt="Grindset Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          <h1 className="text-gradient">GRINDSET</h1>
        </div>
        
        <h2 style={{marginBottom: '24px'}}>{isSignUp ? 'Create Account' : 'Initialize Session'}</h2>
        
        {message && <div className="auth-message text-warning">{message}</div>}

        <button 
          className="btn btn-outline w-full flex items-center justify-center gap-2" 
          onClick={handleGoogleLogin}
          style={{marginBottom: '20px'}}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center w-full gap-2" style={{marginBottom: '20px', color: 'var(--text-muted)'}}>
          <div style={{flex: 1, height: '1px', background: 'var(--border-subtle)'}}></div>
          <span style={{fontSize: '0.9rem'}}>OR</span>
          <div style={{flex: 1, height: '1px', background: 'var(--border-subtle)'}}></div>
        </div>

        <form onSubmit={handleAuth} className="flex-col w-full gap-4">
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          
          <button type="submit" className="btn btn-primary animate-pulse-glow" disabled={loading} style={{marginTop: '16px'}}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <button 
          className="toggle-auth text-secondary mt-4"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>
      </div>
    </motion.div>
  );
};

export default Auth;
