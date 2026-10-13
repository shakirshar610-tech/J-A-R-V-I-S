import React, { useState } from 'react';
import { 
  Home, 
  Lightbulb, 
  Thermometer, 
  ShieldCheck, 
  Zap, 
  Speaker, 
  Sliders, 
  Power, 
  Info, 
  Radio, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { SmartDevice, JarvisSettings } from '../../types';
import { playSciFiSound } from '../../utils/audio';

interface SmartHomeViewProps {
  settings: JarvisSettings;
}

export const SmartHomeView: React.FC<SmartHomeViewProps> = ({ settings }) => {
  const [devices, setDevices] = useState<SmartDevice[]>([
    {
      id: 'dev-1',
      name: 'Workshop Arc Illumination',
      type: 'light',
      room: 'Main Lab',
      status: true,
      value: 85,
      unit: '%',
      color: '#00d2ff',
      isSimulated: true,
    },
    {
      id: 'dev-2',
      name: 'Climate Regulation Matrix',
      type: 'thermostat',
      room: 'Penthouse Suite',
      status: true,
      value: 71,
      unit: '°F',
      isSimulated: true,
    },
    {
      id: 'dev-3',
      name: 'Perimeter Armor Lockdown',
      type: 'security',
      room: 'Facility Exterior',
      status: true,
      unit: 'SECURED',
      isSimulated: true,
    },
    {
      id: 'dev-4',
      name: 'Arc Reactor Core Battery Grid',
      type: 'power',
      room: 'Sub-Level 3',
      status: true,
      value: 98,
      unit: '% Output',
      isSimulated: true,
    },
    {
      id: 'dev-5',
      name: 'Holographic Sound Array',
      type: 'audio',
      room: 'Executive Lounge',
      status: false,
      value: 40,
      unit: '% Vol',
      isSimulated: true,
    },
  ]);

  const [lockdownMode, setLockdownMode] = useState(false);

  const toggleDevice = (id: string) => {
    if (settings.soundEffectsEnabled) playSciFiSound('click');
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: !d.status } : d))
    );
  };

  const updateDeviceValue = (id: string, val: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value: val } : d))
    );
  };

  const toggleLockdown = () => {
    const nextState = !lockdownMode;
    setLockdownMode(nextState);
    if (settings.soundEffectsEnabled) {
      playSciFiSound(nextState ? 'alert' : 'affirmative');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 border border-cyan-500/30 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-bold text-lg text-cyan-200">
              SMART FACILITY CONTROL CENTER
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans max-w-xl">
            Monitor and control environmental automation systems. All cards below are transparently running in holographic demo mode with real-time reactive states.
          </p>
        </div>

        {/* Security Lockdown Button */}
        <button
          onClick={toggleLockdown}
          className={`px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs tracking-wider flex items-center gap-2 transition-all ${
            lockdownMode
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{lockdownMode ? 'LOCKDOWN ACTIVE' : 'ENGAGE LOCKDOWN'}</span>
        </button>
      </div>

      {/* Demo Status Banner */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-xs font-mono flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-300">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>BRIDGE MODE: SIMULATED FACILITY (HOME ASSISTANT READY)</span>
        </div>
        <span className="text-[10px] text-slate-400">5 DEMO NODES CONNECTED</span>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          return (
            <div
              key={device.id}
              className={`p-4 rounded-xl transition-all border flex flex-col justify-between space-y-4 ${
                device.status
                  ? 'bg-slate-900/80 border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.15)]'
                  : 'bg-slate-950/60 border-slate-800 opacity-70'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    {device.room}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-200 mt-1">
                    {device.name}
                  </h4>
                </div>

                <button
                  onClick={() => toggleDevice(device.id)}
                  className={`p-2 rounded-xl border transition-all ${
                    device.status
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(0,210,255,0.4)]'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title="Toggle Power"
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Value / Control Slider */}
              {device.value !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Level</span>
                    <span className="text-cyan-300 font-bold">
                      {device.value}
                      {device.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={device.type === 'thermostat' ? 90 : 100}
                    value={device.value}
                    disabled={!device.status}
                    onChange={(e) => updateDeviceValue(device.id, parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
                  />
                </div>
              )}

              {/* Footer info */}
              <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[10px] font-mono">
                <span className={device.status ? 'text-emerald-400' : 'text-slate-500'}>
                  {device.status ? 'ACTIVE / ONLINE' : 'POWER OFF'}
                </span>
                <span className="text-amber-400/80">[SIMULATED]</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Home Assistant Integration Guide */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>HOME ASSISTANT INTEGRATION BLUEPRINT</span>
        </div>
        <p className="text-slate-300 font-sans leading-relaxed">
          To link physical Zigbee/Z-Wave/Matter devices in your home or lab with J.A.R.V.I.S.:
        </p>
        <ol className="list-decimal list-inside text-slate-400 space-y-1.5 font-mono text-[11px]">
          <li>Deploy an instance of <a href="https://www.home-assistant.io" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Home Assistant</a> on your local network (e.g. Raspberry Pi or local server).</li>
          <li>Generate a Long-Lived Access Token in Home Assistant Profile.</li>
          <li>Configure your server proxy route <code className="text-cyan-300">/api/homeassistant/states</code> to query your HA WebSocket or REST API without exposing tokens in the client.</li>
          <li>J.A.R.V.I.S. will automatically map voice commands like "Dim the lab lights" to Home Assistant service calls.</li>
        </ol>
      </div>
    </div>
  );
};
