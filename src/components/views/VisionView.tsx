import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  Upload, 
  Camera, 
  X, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle,
  VideoOff,
  Image as ImageIcon
} from 'lucide-react';
import { sendVisionAnalysis } from '../../services/api';
import { JarvisSettings } from '../../types';
import { playSciFiSound, speakText, stopSpeaking } from '../../utils/audio';

interface VisionViewProps {
  settings: JarvisSettings;
}

export const VisionView: React.FC<VisionViewProps> = ({ settings }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [prompt, setPrompt] = useState('Analyze this image in detail and describe key elements, technical specs, or text visible.');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Unsupported format. Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setMimeType(file.type);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setAnalysisResult(null);
      if (settings.soundEffectsEnabled) playSciFiSound('scan');
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
    } catch (err: any) {
      setErrorMsg('Camera access denied or device unavailable. Please allow camera access in your browser.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setSelectedImage(dataUrl);
    setMimeType('image/jpeg');
    stopCamera();
    if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
  };

  const runAnalysis = async () => {
    if (!selectedImage || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    if (settings.soundEffectsEnabled) playSciFiSound('scan');

    try {
      const res = await sendVisionAnalysis({
        prompt: prompt.trim() || 'Analyze this image in detail.',
        imageBase64: selectedImage,
        mimeType,
      });

      setAnalysisResult(res.analysis);
      if (settings.soundEffectsEnabled) playSciFiSound('affirmative');

      if (settings.autoSpeakResponses) {
        speakText(res.analysis.slice(0, 300), {
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          voiceURI: settings.voiceURI,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Vision analysis failed.');
      if (settings.soundEffectsEnabled) playSciFiSound('alert');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    stopSpeaking();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-cyan-950/40 border border-sky-500/30 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-400" />
            <h2 className="font-orbitron font-bold text-lg text-sky-200">
              MULTIMODAL OPTICAL DIAGNOSTICS
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans max-w-xl">
            Upload schematics, diagrams, photos, or capture a live webcam feed. J.A.R.V.I.S. uses Gemini's multimodal vision engine to analyze and report observations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>VISION PROTOCOL READY</span>
        </div>
      </div>

      {/* Main Vision Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Input Area */}
        <div className="space-y-4">
          <div className="relative rounded-2xl bg-slate-900/80 border border-cyan-500/20 overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-4">
            {/* Live Camera View */}
            {isCameraActive ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>OPTICAL SENSOR ACTIVE</span>
                </div>

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover rounded-xl border border-cyan-500/40"
                />

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={captureCameraFrame}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,210,255,0.4)]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Frame</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5"
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>Halt Camera</span>
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              /* Image Preview */
              <div className="relative w-full flex flex-col items-center">
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-900/80 text-white transition-colors"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={selectedImage}
                  alt="Target upload"
                  className="max-h-72 w-auto object-contain rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(0,210,255,0.2)]"
                />
              </div>
            ) : (
              /* Empty Upload Prompt */
              <div className="text-center space-y-4 p-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-orbitron font-semibold text-sm text-cyan-200">
                    AWAITING OPTICAL FEED
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Upload an image or activate the secure live webcam sensor.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Camera Capture</span>
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Prompt Input */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20 space-y-3">
            <label className="block text-xs font-mono text-cyan-300">
              ANALYSIS DIRECTIVE / QUESTION:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="What would you like J.A.R.V.I.S. to diagnose regarding this image?"
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />

            <button
              onClick={runAnalysis}
              disabled={!selectedImage || isAnalyzing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Optical Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Optical Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Real Diagnostics Analysis Output */}
        <div className="flex flex-col rounded-2xl bg-slate-900/80 border border-cyan-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="font-orbitron font-semibold text-sm text-cyan-300">
                DIAGNOSTIC REPORT
              </h3>
            </div>
            {analysisResult && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                ANALYSIS COMPLETE
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[460px] p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed space-y-2">
            {isAnalyzing ? (
              <div className="h-48 flex flex-col items-center justify-center space-y-3 text-cyan-300">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Extracting feature vectors and optical diagnostics...</span>
              </div>
            ) : analysisResult ? (
              <div className="whitespace-pre-wrap">{analysisResult}</div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-600" />
                <p>Upload an image and click "Run Optical Diagnostics" to generate a detailed AI breakdown.</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
