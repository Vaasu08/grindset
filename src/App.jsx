import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import Home from './pages/Home';
import GrindSession from './pages/GrindSession';
import Auth from './pages/Auth';
import Summary from './pages/Summary';

const AnimatedRoutes = ({ session }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={session ? <Home session={session} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/grind" 
          element={session ? <GrindSession session={session} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/auth" 
          element={!session ? <Auth /> : <Navigate to="/" />} 
        />
        <Route 
          path="/summary" 
          element={session ? <Summary /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="container flex items-center justify-center" style={{height: '100vh'}}>Loading...</div>;
  }

  return (
    <Router>
      <AnimatedRoutes session={session} />
    </Router>
  );
}

export default App;
