import React, { useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface LiveWaveformProps {
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  noiseLevelDb?: number;
}

export const LiveWaveform: React.FC<LiveWaveformProps> = ({
  isActive = true,
  isMuted = false,
  onToggleMute,
  noiseLevelDb = 22,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const numBars = 48;
      const barWidth = canvas.width / numBars - 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isActive && !isMuted) {
          // Compute animated audio amplitude without gradients
          const sinFactor = Math.sin(phase + i * 0.25);
          const cosFactor = Math.cos(phase * 0.8 + i * 0.15);
          const amp = Math.max(0.1, (sinFactor + cosFactor + 2) / 4);
          barHeight = amp * (canvas.height * 0.75);
        }

        const x = i * (barWidth + 2);
        const y = centerY - barHeight / 2;

        // Modern indigo bars when active, rose when muted, muted slate when inactive
        ctx.fillStyle = isMuted ? '#F43F5E' : isActive ? '#6366F1' : '#1E293B';
        ctx.fillRect(x, y, barWidth, Math.max(3, barHeight));
      }

      phase += 0.1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isMuted]);

  return (
    <div className="p-3.5 bg-[#0E1424] border border-[#1F293D] rounded-xl flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive && !isMuted ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-slate-300 font-medium tracking-tight">
            Telephony WebRTC Ingest
          </span>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
            16kHz · Mono
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs">
            SNR: <span className="font-mono text-slate-200">{noiseLevelDb} dB</span>
          </span>
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-[#141C30] text-slate-400 border-[#1F293D] hover:text-slate-100 hover:border-slate-700'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg overflow-hidden p-2 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={460}
          height={40}
          className="w-full h-10 block"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Chunks: 250ms streaming slice</span>
        <span className="text-slate-300">Silero VAD: Speech Detected (0.94)</span>
      </div>
    </div>
  );
};
