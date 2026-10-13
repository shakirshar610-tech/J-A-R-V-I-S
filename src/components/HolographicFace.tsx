import React from 'react';
import { motion } from 'motion/react';
import { Mic, Volume2, Shield, Eye, Radio, Sparkles } from 'lucide-react';

interface HolographicFaceProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isWakeWordListening: boolean;
  onFaceClick?: () => void;
}

export const HolographicFace: React.FC<HolographicFaceProps> = ({
  isActive,
  isListening,
  isSpeaking,
  isWakeWordListening,
  onFaceClick,
}) => {
  // Determine overall face state
  const getStatus = () => {
    if (!isActive) return { label: 'OFFLINE / STANDBY', color: 'text-slate-500', badge: 'bg-slate-900 border-slate-700' };
    if (isListening) return { label: 'ACOUSTIC LISTENING', color: 'text-cyan-300', badge: 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]' };
    if (isSpeaking) return { label: 'VOCAL TRANSMISSION', color: 'text-sky-300', badge: 'bg-sky-950/80 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.4)]' };
    if (isWakeWordListening) return { label: 'WAKE WORD: ARMED ("JARVIS...")', color: 'text-emerald-300', badge: 'bg-emerald-950/80 border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
    return { label: 'JARVIS ONLINE', color: 'text-cyan-400', badge: 'bg-cyan-950/50 border-cyan-500/40' };
  };

  const status = getStatus();

  return (
    <div className="flex flex-col items-center justify-center select-none py-2">
      {/* Outer Holographic Container with 3 Concentric Rings */}
      <div
        className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center cursor-pointer group"
        onClick={onFaceClick}
        title="Click to engage or toggle voice control"
      >
        {/* Glow Aura */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            !isActive
              ? 'opacity-10 bg-slate-800'
              : isSpeaking
              ? 'opacity-80 bg-sky-500/40 scale-110'
              : isListening
              ? 'opacity-80 bg-cyan-400/45 scale-105'
              : isWakeWordListening
              ? 'opacity-60 bg-emerald-500/30'
              : 'opacity-40 bg-cyan-500/25'
          }`}
        />

        {/* ======================================================== */}
        {/* 3 CONCENTRIC HOLOGRAPHIC RINGS */}
        {/* ======================================================== */}

        {/* Ring 1: Outermost Telemetry Compass Ring (Clockwise) */}
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-500/25 border-dashed"
          animate={{ rotate: isActive ? 360 : 0 }}
          transition={{ repeat: Infinity, duration: isListening ? 15 : 30, ease: 'linear' }}
        >
          {/* Compass Navigation Nodes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-3.5 bg-cyan-400 rounded-sm shadow-[0_0_8px_#00e5ff]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-3.5 bg-cyan-400/60 rounded-sm" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-3.5 bg-cyan-400/60 rounded-sm" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-3.5 bg-cyan-400/60 rounded-sm" />

          {/* Micro Angular Coordinates */}
          <span className="absolute top-2 right-12 text-[8px] font-mono text-cyan-400/50">ARC-85</span>
          <span className="absolute bottom-2 left-12 text-[8px] font-mono text-cyan-400/50">SEC-01</span>
        </motion.div>

        {/* Ring 2: Middle Segmented Arc Ring (Counter-Clockwise) */}
        <motion.div
          className="absolute inset-3 sm:inset-4 rounded-full border-2 border-transparent border-t-cyan-400/80 border-b-cyan-500/40"
          animate={{ rotate: isActive ? -360 : 0 }}
          transition={{ repeat: Infinity, duration: isSpeaking ? 10 : 20, ease: 'linear' }}
        />

        {/* Ring 3: Inner Gyroscopic Optical Reticle Ring */}
        <motion.div
          className="absolute inset-7 sm:inset-9 rounded-full border border-cyan-400/30 border-l-cyan-300/80 border-r-transparent"
          animate={{ rotate: isActive ? 360 : 0 }}
          transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
        />

        {/* Radar Pulse Wave (Emits when Wake Word is listening or when user speaks) */}
        {(isListening || isWakeWordListening) && isActive && (
          <motion.div
            className={`absolute inset-2 rounded-full border-2 ${
              isListening ? 'border-cyan-300' : 'border-emerald-400/60'
            }`}
            animate={{
              scale: [0.85, 1.15, 1.3],
              opacity: [0.8, 0.3, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: isListening ? 1.4 : 2.5,
              ease: 'easeOut',
            }}
          />
        )}

        {/* ======================================================== */}
        {/* HOLOGRAPHIC FACE HUD CORE (EYES + MOUTH + SCANNER) */}
        {/* ======================================================== */}
        <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-400/50 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_35px_rgba(0,210,255,0.4)]">
          {/* Subtle Vertical Scanning Laser Beam */}
          {isActive && (
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_12px_#00e5ff] pointer-events-none z-20"
              animate={{
                top: ['0%', '100%', '0%'],
              }}
              transition={{
                repeat: Infinity,
                duration: isListening ? 2 : 4,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Holographic Hex Pattern Overlay */}
          <div className="absolute inset-0 hex-pattern opacity-25 pointer-events-none" />

          {/* Top Cybernetic Forehead Diagnostics */}
          <div className="absolute top-3 flex items-center gap-1.5 z-10">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} />
            <span className="text-[8px] font-mono tracking-widest text-cyan-400/70 uppercase">
              {isActive ? 'FACIAL HUD MK-85' : 'STANDBY'}
            </span>
          </div>

          {/* ======================================================== */}
          {/* CYBERNETIC EYES WITH ROTATING IRIS / PUPILS */}
          {/* ======================================================== */}
          <div className="flex items-center justify-center gap-8 sm:gap-10 my-2 z-10">
            {/* Left Eye */}
            <div className="relative w-12 h-10 sm:w-14 sm:h-12 flex items-center justify-center">
              {/* Outer Eye Socket */}
              <div
                className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
                  !isActive
                    ? 'border-slate-700 bg-slate-900/60'
                    : isListening
                    ? 'border-cyan-300 bg-cyan-950/50 shadow-[0_0_15px_rgba(0,229,255,0.6)]'
                    : isSpeaking
                    ? 'border-sky-300 bg-sky-950/50 shadow-[0_0_15px_rgba(14,165,233,0.6)]'
                    : 'border-cyan-500/70 bg-cyan-950/30 shadow-[0_0_10px_rgba(0,210,255,0.3)]'
                }`}
              />

              {/* Rotating Pupil / Iris reticle */}
              {isActive ? (
                <motion.div
                  className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-cyan-400/80 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: isListening ? 3 : 8, ease: 'linear' }}
                >
                  {/* Glowing pupil center */}
                  <motion.div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSpeaking
                        ? 'bg-sky-300 shadow-[0_0_10px_#38bdf8]'
                        : isListening
                        ? 'bg-cyan-200 shadow-[0_0_10px_#00e5ff]'
                        : 'bg-cyan-400 shadow-[0_0_6px_#00e5ff]'
                    }`}
                    animate={{
                      scale: isSpeaking ? [0.8, 1.25, 0.9, 1.3, 0.8] : [1, 1.1, 1],
                    }}
                    transition={{ repeat: Infinity, duration: isSpeaking ? 0.7 : 2 }}
                  />
                  {/* Iris tick mark */}
                  <div className="absolute top-0 w-1 h-1.5 bg-cyan-300 rounded-full" />
                </motion.div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-700" />
              )}
            </div>

            {/* Right Eye */}
            <div className="relative w-12 h-10 sm:w-14 sm:h-12 flex items-center justify-center">
              {/* Outer Eye Socket */}
              <div
                className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
                  !isActive
                    ? 'border-slate-700 bg-slate-900/60'
                    : isListening
                    ? 'border-cyan-300 bg-cyan-950/50 shadow-[0_0_15px_rgba(0,229,255,0.6)]'
                    : isSpeaking
                    ? 'border-sky-300 bg-sky-950/50 shadow-[0_0_15px_rgba(14,165,233,0.6)]'
                    : 'border-cyan-500/70 bg-cyan-950/30 shadow-[0_0_10px_rgba(0,210,255,0.3)]'
                }`}
              />

              {/* Rotating Pupil / Iris reticle (Counter Rotating for gyroscopic realism) */}
              {isActive ? (
                <motion.div
                  className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-cyan-400/80 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: isListening ? 3 : 8, ease: 'linear' }}
                >
                  {/* Glowing pupil center */}
                  <motion.div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSpeaking
                        ? 'bg-sky-300 shadow-[0_0_10px_#38bdf8]'
                        : isListening
                        ? 'bg-cyan-200 shadow-[0_0_10px_#00e5ff]'
                        : 'bg-cyan-400 shadow-[0_0_6px_#00e5ff]'
                    }`}
                    animate={{
                      scale: isSpeaking ? [0.8, 1.25, 0.9, 1.3, 0.8] : [1, 1.1, 1],
                    }}
                    transition={{ repeat: Infinity, duration: isSpeaking ? 0.7 : 2 }}
                  />
                  {/* Iris tick mark */}
                  <div className="absolute top-0 w-1 h-1.5 bg-cyan-300 rounded-full" />
                </motion.div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-700" />
              )}
            </div>
          </div>

          {/* Eye Brow Tech Lines */}
          <div className="flex items-center gap-12 sm:gap-14 my-1 opacity-70">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-cyan-400" />
            <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>

          {/* ======================================================== */}
          {/* AUDIO-REACTIVE MOUTH WAVEFORM BARS */}
          {/* ======================================================== */}
          <div className="mt-3 flex items-center justify-center gap-1 h-7 z-10 px-4">
            {[18, 35, 60, 90, 100, 75, 45, 80, 50].map((baseHeight, i) => {
              return (
                <motion.div
                  key={i}
                  className={`w-1 sm:w-1.5 rounded-full transition-all duration-100 ${
                    !isActive
                      ? 'bg-slate-700 h-1.5'
                      : isSpeaking
                      ? 'bg-gradient-to-t from-sky-500 to-cyan-300 shadow-[0_0_8px_#00e5ff]'
                      : isListening
                      ? 'bg-cyan-400 shadow-[0_0_6px_#00e5ff]'
                      : 'bg-cyan-900/50'
                  }`}
                  animate={
                    isActive && (isSpeaking || isListening)
                      ? {
                          height: isSpeaking
                            ? [
                                `${Math.max(6, Math.round(baseHeight * 0.3))}px`,
                                `${Math.max(10, Math.round(baseHeight * 0.9))}px`,
                                `${Math.max(8, Math.round(baseHeight * 0.5))}px`,
                                `${Math.max(12, Math.round(baseHeight * 1.0))}px`,
                                `${Math.max(6, Math.round(baseHeight * 0.3))}px`,
                              ]
                            : [
                                `${Math.max(4, Math.round(baseHeight * 0.2))}px`,
                                `${Math.max(6, Math.round(baseHeight * 0.5))}px`,
                                `${Math.max(4, Math.round(baseHeight * 0.2))}px`,
                              ],
                        }
                      : { height: isActive ? '4px' : '2px' }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: isSpeaking ? 0.6 + i * 0.05 : 1.2,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
          </div>

          {/* Bottom Audio Frequency Grate */}
          <div className="absolute bottom-2.5 flex items-center gap-1">
            <span className="text-[7px] font-mono text-cyan-400/60 uppercase">
              {isSpeaking ? 'AUDIO VOCAL FREQ 24kHz' : isListening ? 'INPUT MIC GAIN +12dB' : 'SYNAPSE IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Holographic Status Pill Under Face */}
      <div className="mt-3 flex flex-col items-center">
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md transition-all ${status.badge}`}>
          <div
            className={`w-2 h-2 rounded-full ${
              !isActive
                ? 'bg-slate-600'
                : isListening
                ? 'bg-cyan-400 animate-ping'
                : isSpeaking
                ? 'bg-sky-400 animate-pulse'
                : isWakeWordListening
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-cyan-400'
            }`}
          />
          <span className={`text-xs font-mono font-bold tracking-wider ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Subtitle Hint */}
        <span className="text-[11px] font-mono text-cyan-400/60 mt-1.5">
          {isActive
            ? isWakeWordListening
              ? '[SAY "JARVIS" FOLLOWED BY ANY COMMAND]'
              : '[CLICK TO ACTIVATE VOICE SENSORS]'
            : '[SYSTEM STANDBY - CLICK POWER TO ACTIVATE]'}
        </span>
      </div>
    </div>
  );
};
