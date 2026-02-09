'use client';

import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function AuthScreen() {
  const handleLogin = async () => {
    const url = await api.getGoogleAuthUrl();
    window.location.href = url;
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-logo">
          <Sparkles size={48} color="white" />
        </div>
        
        <h1 className="auth-title">AI Companion</h1>
        <p className="auth-subtitle">
          Your intelligent math tutor and problem solver.<br />
          Ready to help you excel.
        </p>

        <div className="auth-box">
          <button onClick={handleLogin} className="google-btn">
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              style={{ width: '20px', height: '20px' }} 
            />
            Continue with Google
          </button>
        </div>

        <motion.div 
          className="auth-features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="auth-feature">
            <CheckCircle2 size={16} color="var(--accent-purple)" />
            <span>Step-by-step</span>
          </div>
          <div className="auth-feature">
            <Zap size={16} color="var(--accent-gold)" />
            <span>Instant Graphs</span>
          </div>
          <div className="auth-feature">
            <ShieldCheck size={16} color="var(--accent-cyan)" />
            <span>Secure</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
