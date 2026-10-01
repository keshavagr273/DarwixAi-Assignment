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

        // Solid color logic: cyan when active, red when muted, muted line when inactive
        ctx.fillStyle = isMuted ? '#FF5C6C' : isActive ? '#4CC9F0' : '#243041';
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
    <div className="p-3 bg-[#121821] border border-[#243041] rounded-md flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive && !isMuted ? 'bg-[#4CC9F0] animate-pulse' : 'bg-[#57677D]'}`} />
          <span className="text-[#8A97A8] uppercase tracking-wider">
            Telephony WebRTC Ingest
          </span>
          <span className="text-[#3DDC97] bg-[#13221C] px-1.5 py-0.2 rounded text-[10px]">
            16kHz · Mono
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#8A97A8]">
            SNR: <span className="text-[#E6EDF5]">{noiseLevelDb} dB</span>
          </span>
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-1 rounded border transition-colors ${
                isMuted
                  ? 'bg-[#251417] text-[#FF5C6C] border-[#FF5C6C]/40'
                  : 'bg-[#18212D] text-[#8A97A8] border-[#243041] hover:text-[#E6EDF5]'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-[#0B0F14] border border-[#243041] rounded overflow-hidden p-1.5 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={460}
          height={40}
          className="w-full h-10 block"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#57677D]">
        <span>Chunks: 250ms streaming slice</span>
        <span>Silero VAD: Speech Detected (0.94)</span>
      </div>
    </div>
  );
};
