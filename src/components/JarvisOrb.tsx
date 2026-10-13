import React from 'react';
import { motion } from 'motion/react';
import { JarvisState } from '../types';
import { Mic, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface JarvisOrbProps {
  state: JarvisState;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  onClick?: () => void;
  interactive?: boolean;
}

export const JarvisOrb: React.FC<JarvisOrbProps> = ({
  state,
  size = 'md',
  onClick,
  interactive = true,
}) => {
  const sizeMap = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    hero: 'w-72 h-72 sm:w-96 sm:h-96',
  };

  const getStatusText = () => {
    switch (state) {
      case 'listening':
        return 'ACOUSTIC SENSORS ACTIVE';
      case 'thinking':
        return 'NEURAL PROCESSING';
      case 'speaking':
        return 'VOCAL SYNTHESIS ACTIVE';
      case 'error':
        return 'SYSTEM ALERT';
      case 'idle':
      default:
        return 'J.A.R.V.I.S. READY';
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'listening':
        return {
          glow: 'rgba(6, 182, 212, 0.7)',
          border: 'border-cyan-400',
          text: 'text-cyan-300',
          core: 'from-cyan-400 via-sky-500 to-blue-600',
        };
      case 'thinking':
        return {
          glow: 'rgba(99, 102, 241, 0.8)',
          border: 'border-indigo-400',
          text: 'text-indigo-300',
          core: 'from-indigo-400 via-sky-400 to-cyan-500',
        };
      case 'speaking':
        return {
          glow: 'rgba(14, 165, 233, 0.85)',
          border: 'border-sky-400',
          text: 'text-sky-300',
          core: 'from-sky-300 via-cyan-400 to-blue-600',
        };
      case 'error':
        return {
          glow: 'rgba(239, 68, 68, 0.7)',
          border: 'border-rose-400',
          text: 'text-rose-300',
          core: 'from-rose-500 via-red-600 to-amber-600',
        };
      case 'idle':
      default:
        return {
          glow: 'rgba(0, 210, 255, 0.45)',
          border: 'border-cyan-500/50',
          text: 'text-cyan-400',
          core: 'from-cyan-500 via-blue-600 to-slate-900',
        };
    }
  };

  const colors = getStateColor();

  return (
    <div className="flex flex-col items-center justify-center select-none group">
      {/* Outer Hologram Container */}
      <div
        className={`relative ${sizeMap[size]} flex items-center justify-center ${
          interactive ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
        title={interactive ? 'Click to toggle Voice Assistant' : undefined}
      >
        {/* Background Ambient Aura */}
        <div
          className="absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            transform: state === 'speaking' ? 'scale(1.25)' : state === 'listening' ? 'scale(1.15)' : 'scale(1)',
          }}
        />

        {/* Ring 1 - Outermost Segmented HUD Compass */}
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-500/20 border-dashed"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: state === 'thinking' ? 12 : 36,
            ease: 'linear',
          }}
        >
          {/* Compass ticks */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-cyan-400/60" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-3 bg-cyan-400/60" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-3 bg-cyan-400/60" />
        </motion.div>

        {/* Ring 2 - Counter Rotating Tech Arc Segments */}
        <motion.div
          className="absolute inset-2 sm:inset-3 rounded-full border-2 border-transparent border-t-cyan-400/70 border-b-cyan-500/50"
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: state === 'thinking' ? 8 : 24,
            ease: 'linear',
          }}
        />

        {/* Ring 3 - Dynamic Audio Waveform Ring / Waveform spikes when speaking */}
        {state === 'speaking' && (
          <motion.div
            className="absolute inset-4 sm:inset-6 rounded-full border-2 border-sky-300/80"
            animate={{
              scale: [0.95, 1.08, 0.98, 1.12, 1],
              opacity: [0.7, 1, 0.8, 1, 0.7],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Ring 4 - Listening radar pulse ring */}
        {state === 'listening' && (
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-cyan-300"
            animate={{
              scale: [0.9, 1.2, 1.35],
              opacity: [0.9, 0.4, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Ring 5 - Inner Gyroscopic Tech Rings */}
        <motion.div
          className="absolute inset-6 sm:inset-8 rounded-full border border-cyan-400/40 border-l-cyan-300 border-r-transparent"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: state === 'thinking' ? 5 : 18,
            ease: 'linear',
          }}
        />

        {/* Central Core Arc Reactor */}
        <motion.div
          className={`relative z-10 w-16 h-16 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr ${colors.core} p-1 shadow-[0_0_35px_rgba(0,210,255,0.7)] flex items-center justify-center`}
          animate={{
            scale:
              state === 'speaking'
                ? [1, 1.08, 0.96, 1.06, 1]
                : state === 'listening'
                ? [1, 1.05, 1]
                : state === 'thinking'
                ? [0.95, 1.05, 0.95]
                : [1, 1.02, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: state === 'speaking' ? 0.8 : state === 'listening' ? 1.4 : 3,
            ease: 'easeInOut',
          }}
        >
          {/* Inner Reactor Glass Lens */}
          <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-300/60 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Holographic light streak */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />

            {/* Core Icon / Waveform indicator */}
            <div className="relative z-10 flex items-center justify-center">
              {state === 'listening' ? (
                <Mic className="w-7 h-7 sm:w-10 sm:h-10 text-cyan-200 animate-pulse" />
              ) : state === 'speaking' ? (
                <Volume2 className="w-7 h-7 sm:w-10 sm:h-10 text-cyan-100 animate-bounce" />
              ) : state === 'thinking' ? (
                <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-200 animate-spin" />
              ) : state === 'error' ? (
                <AlertCircle className="w-7 h-7 sm:w-10 sm:h-10 text-rose-300 animate-pulse" />
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#00e5ff]" />
                  <div className="w-1.5 h-9 bg-cyan-300 rounded-full animate-pulse [animation-delay:150ms] shadow-[0_0_10px_#00e5ff]" />
                  <div className="w-1.5 h-5 bg-cyan-400 rounded-full animate-pulse [animation-delay:300ms] shadow-[0_0_8px_#00e5ff]" />
                </div>
              )}
            </div>

            {/* Tiny Core HUD telemetry text */}
            <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-cyan-300/80 uppercase mt-1">
              MK-85
            </span>
          </div>
        </motion.div>

        {/* Orbiting Photon Particles */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
        >
          <div className="absolute top-2 left-1/4 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#00e5ff]" />
          <div className="absolute bottom-4 right-1/4 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
        </motion.div>
      </div>

      {/* Futuristic HUD Telemetry Banner Under Orb */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-sm">
          <div
            className={`w-2 h-2 rounded-full ${
              state === 'listening'
                ? 'bg-cyan-400 animate-ping'
                : state === 'speaking'
                ? 'bg-sky-400 animate-pulse'
                : state === 'thinking'
                ? 'bg-indigo-400 animate-spin'
                : state === 'error'
                ? 'bg-rose-500 animate-ping'
                : 'bg-cyan-500'
            }`}
          />
          <span className={`text-xs font-mono font-semibold tracking-wider ${colors.text}`}>
            {getStatusText()}
          </span>
        </div>
        {interactive && (
          <span className="text-[11px] font-mono text-cyan-400/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            [CLICK ORB TO TOGGLE VOICE COMM]
          </span>
        )}
      </div>
    </div>
  );
};
