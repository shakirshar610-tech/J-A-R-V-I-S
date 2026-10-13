import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Check, 
  Code2, 
  Cpu, 
  Layers, 
  Lock,
  Maximize2,
  Minimize2,
  Battery,
  BatteryCharging,
  Bell,
  Download,
  VolumeX,
  Volume2
} from 'lucide-react';
import { JarvisSettings } from '../../types';
import { playSciFiSound, stopSpeaking } from '../../utils/audio';

interface DesktopViewProps {
  settings: JarvisSettings;
}

export const DesktopView: React.FC<DesktopViewProps> = ({ settings }) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [actionLog, setActionLog] = useState<Array<{ text: string; time: string; type: string }>>([
    { text: 'Desktop Control Environment Active', time: new Date().toLocaleTimeString(), type: 'info' },
  ]);

  // Read real battery status if available in browser
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryInfo({
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        });
        battery.addEventListener('levelchange', () => {
          setBatteryInfo({ level: Math.round(battery.level * 100), charging: battery.charging });
        });
        battery.addEventListener('chargingchange', () => {
          setBatteryInfo({ level: Math.round(battery.level * 100), charging: battery.charging });
        });
      }).catch(() => {});
    }

    const checkFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, []);

  const logAction = (text: string, type: 'success' | 'info' | 'alert') => {
    const time = new Date().toLocaleTimeString();
    setActionLog((prev) => [{ text, time, type }, ...prev.slice(0, 9)]);
  };

  // Real Hardware Control 1: Fullscreen Mode
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        logAction('Desktop Fullscreen Mode Activated', 'success');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        logAction('Desktop Fullscreen Mode Exited', 'info');
      }
      if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
    } catch (err: any) {
      logAction('Fullscreen request error: ' + err.message, 'alert');
    }
  };

  // Real Hardware Control 2: Native Desktop Notification
  const sendNativeDesktopNotification = async () => {
    if (typeof Notification === 'undefined') {
      logAction('Desktop Notifications not supported in this browser.', 'alert');
      return;
    }

    let perm = Notification.permission;
    if (perm !== 'granted') {
      perm = await Notification.requestPermission();
      setNotificationStatus(perm);
    }

    if (perm === 'granted') {
      new Notification('J.A.R.V.I.S. Desktop Alert', {
        body: 'Systems operational, sir. Desktop telemetry link is synchronized.',
        icon: '/favicon.ico',
      });
      logAction('Native OS Notification Dispatched to Windows/macOS tray', 'success');
      if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
    } else {
      logAction('Desktop notification permission denied by user.', 'alert');
    }
  };

  // Real Hardware Control 3: Copy Command to OS Clipboard
  const copyCommandToClipboard = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd);
    logAction(`Copied "${label}" to desktop clipboard: ${cmd}`, 'success');
    if (settings.soundEffectsEnabled) playSciFiSound('click');
  };

  // Real Hardware Control 4: Mute/Halt Audio
  const handleMuteAllAudio = () => {
    stopSpeaking();
    logAction('All active audio channels halted', 'info');
    if (settings.soundEffectsEnabled) playSciFiSound('click');
  };

  // Real Downloadable Free Windows Companion Script
  const downloadWindowsBatchController = () => {
    const batScript = `@echo off
title JARVIS AI - Windows Desktop Companion MK-85
color 0B
cls
echo ===================================================
echo     J.A.R.V.I.S. WINDOWS CONTROLLER MK-85
echo     Created by Tony Shakir hussain Protocols
echo ===================================================
echo.
echo Select action:
echo [1] Lock Windows Workstation
echo [2] Launch Windows Terminal / PowerShell
echo [3] Launch Windows Task Manager
echo [4] Check System Battery and Diagnostics
echo [5] Test Network Connectivity (Ping)
echo [6] Exit
echo.
set /p opt="Enter choice [1-6]: "

if "%opt%"=="1" (
    echo Locking workstation...
    rundll32.exe user32.dll,LockWorkStation
)
if "%opt%"=="2" (
    start powershell.exe
)
if "%opt%"=="3" (
    start taskmgr.exe
)
if "%opt%"=="4" (
    systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Boot Time"
    pause
)
if "%opt%"=="5" (
    ping google.com -n 4
    pause
)
if "%opt%"=="6" exit
`;

    const blob = new Blob([batScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jarvis_windows_controller.bat';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    logAction('Downloaded "jarvis_windows_controller.bat" for direct Windows PC control.', 'success');
    if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
  };

  const approvedWebPortals = [
    {
      name: 'Google Calendar',
      url: 'https://calendar.google.com',
      description: 'Review schedules & upcoming calendar appointments',
      category: 'Productivity',
    },
    {
      name: 'Gmail Workspace',
      url: 'https://mail.google.com',
      description: 'Check incoming transmissions & communications',
      category: 'Comms',
    },
    {
      name: 'GitHub Repositories',
      url: 'https://github.com',
      description: 'Manage codebases, commits, and pull requests',
      category: 'Development',
    },
    {
      name: 'Google AI Studio',
      url: 'https://aistudio.google.com',
      description: 'Access Gemini models & manage API keys',
      category: 'Neural Deck',
    },
    {
      name: 'YouTube Media',
      url: 'https://youtube.com',
      description: 'Launch media streaming & video portals',
      category: 'Media',
    },
    {
      name: 'Google Maps Navigation',
      url: 'https://maps.google.com',
      description: 'Geospatial mapping and route telemetry',
      category: 'Navigation',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-cyan-950/40 border border-blue-500/30 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h2 className="font-orbitron font-bold text-lg text-blue-200">
              DESKTOP CONTROL & OS INTEGRATION
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans max-w-xl">
            Real desktop browser controls, direct web application launchers, native notification triggers, and a free downloadable Windows companion controller.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DESKTOP BRIDGE (SANDBOXED)</span>
        </div>
      </div>

      {/* Protocol Prerequisite Notice */}
      <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-cyan-300">CORE SYSTEM PREREQUISITE:</span>
          <span className="ml-1 text-slate-300">
            Microphone input, speech synthesis audio, and AI chat operate independently. Use the System Diagnostics panel on the Dashboard to test and confirm audio and neural links.
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. REAL HARDWARE & BROWSER CONTROLS */}
      {/* ======================================================== */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/25 space-y-4">
        <h3 className="font-orbitron text-xs font-bold text-cyan-300 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>DIRECT DESKTOP HARDWARE ACTIONS</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-mono text-cyan-300 font-bold">Fullscreen Mode</span>
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {isFullscreen ? 'Exit true fullscreen' : 'Expand window to full display'}
            </p>
          </button>

          {/* Action 2: Native Desktop Notification */}
          <button
            onClick={sendNativeDesktopNotification}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-mono text-emerald-300 font-bold">OS Notification</span>
              <Bell className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400">
              Dispatch alert to Windows / macOS tray
            </p>
          </button>

          {/* Action 3: Copy Windows Lock Command */}
          <button
            onClick={() => copyCommandToClipboard('rundll32.exe user32.dll,LockWorkStation', 'Lock Workstation')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 text-left transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-mono text-amber-300 font-bold">Lock Command</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400">
              Copy Windows lock shortcut to clipboard
            </p>
          </button>

          {/* Action 4: Halt Speech / Audio Mute */}
          <button
            onClick={handleMuteAllAudio}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-rose-950/60 border border-rose-500/30 hover:border-rose-400 text-left transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-mono text-rose-300 font-bold">Halt Audio Feed</span>
              <VolumeX className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-[10px] text-slate-400">
              Silence all active speech and synthesizers
            </p>
          </button>
        </div>

        {/* Battery Diagnostics if available */}
        {batteryInfo && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300">
              {batteryInfo.charging ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <Battery className="w-4 h-4 text-cyan-400" />
              )}
              <span>DEVICE BATTERY TELEMETRY:</span>
              <span className="font-bold text-slate-100">{batteryInfo.level}%</span>
              {batteryInfo.charging && <span className="text-emerald-400">(Charging)</span>}
            </div>
            <span className="text-[10px] text-slate-400">Real OS Hardware API</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. FREE DOWNLOADABLE WINDOWS COMPANION CONTROLLER */}
      {/* ======================================================== */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-400/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-300 font-bold font-orbitron text-xs">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>FREE WINDOWS DESKTOP CONTROLLER SCRIPT (.BAT)</span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Want to lock your PC, open PowerShell, or check hardware diagnostics without paying for software? Download our free, 100% open Windows batch controller!
            </p>
          </div>

          <button
            onClick={downloadWindowsBatchController}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download .BAT Controller</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="text-cyan-300 font-semibold">How to use on Windows:</div>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Click <strong>Download .BAT Controller</strong> above.</li>
            <li>Double-click the downloaded <code className="text-cyan-400">jarvis_windows_controller.bat</code> file on your PC.</li>
            <li>Select options to lock workstation, open PowerShell, or inspect system diagnostics directly!</li>
          </ol>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. APPROVED WEB APPLICATION PORTALS (Direct Reliable Links) */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <h3 className="font-orbitron text-xs font-bold text-cyan-300">
          APPROVED WEB WORKSPACE PORTALS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {approvedWebPortals.map((portal, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20 hover:border-cyan-400/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">
                    {portal.name}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    {portal.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  {portal.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10">
                <span className="text-[10px] font-mono text-cyan-400/60 truncate max-w-[200px]">
                  {portal.url}
                </span>
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => logAction(`Opened ${portal.name}`, 'success')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>Launch</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. REAL-TIME ACTIVITY LOG */}
      {/* ======================================================== */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-2 font-mono text-xs">
        <span className="text-cyan-400 font-semibold tracking-wider">
          DESKTOP ACTION EVENT LOG:
        </span>
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {actionLog.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="text-cyan-400/60">[{log.time}]</span>
              <span
                className={
                  log.type === 'success'
                    ? 'text-emerald-300'
                    : log.type === 'alert'
                    ? 'text-rose-300'
                    : 'text-slate-300'
                }
              >
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
