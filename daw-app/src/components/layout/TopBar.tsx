import { Play, Pause, Square, Circle, Metronome, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../lib/store/useStore';
import { ProjectMenu } from './ProjectMenu';
import { exportWav } from '../../lib/audio/export/exporter';
import { Download } from 'lucide-react';

export function TopBar() {
  const [isExporting, setIsExporting] = useState(false);
  const {
    isPlaying,
    togglePlay,
    stopPlayback,
    isRecording,
    toggleRecording,
    bpm,
    setBpm,
    metronomeEnabled,
    toggleMetronome,
    loopEnabled,
    toggleLoop,
    transportPosition
  } = useStore();

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-50">
      {/* Left: Branding & Project Settings */}
      <div className="flex items-center space-x-4 w-1/3">
        <ProjectMenu />
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center space-x-2 w-1/3 justify-center">
        <button
          onClick={stopPlayback}
          className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Stop"
        >
          <Square size={20} className="fill-current" />
        </button>
        <button
          onClick={togglePlay}
          className={`p-2 rounded hover:bg-zinc-800 transition-colors ${isPlaying ? 'text-green-400' : 'text-zinc-400 hover:text-white'}`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
        </button>
        <button
          onClick={toggleRecording}
          className={`p-2 rounded transition-colors ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          title="Record"
        >
          <Circle size={20} className="fill-current" />
        </button>

        <div className="w-px h-6 bg-zinc-800 mx-2"></div>

        <button
          onClick={toggleLoop}
          className={`p-2 rounded transition-colors ${loopEnabled ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          title="Loop"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Right: Display & Settings */}
      <div className="flex items-center justify-end space-x-4 w-1/3">
        <div className="font-mono text-sm bg-zinc-950 px-3 py-1.5 rounded text-green-400 border border-zinc-800 flex items-center min-w-[100px] justify-center">
           {transportPosition.split('.')[0] || "0:0:0"}
        </div>

        <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
          <div className="px-2 text-xs text-zinc-500 uppercase font-bold bg-zinc-900 border-r border-zinc-800 flex items-center h-full">BPM</div>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-14 bg-transparent text-center text-sm focus:outline-none focus:bg-zinc-800 h-8 font-mono"
            min="30" max="300"
          />
        </div>

        <button
          onClick={toggleMetronome}
          className={`p-2 rounded transition-colors ${metronomeEnabled ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          title="Metronome"
        >
          <Metronome size={20} />
        </button>

        <button
          onClick={async () => {
              setIsExporting(true);
              const blob = await exportWav();
              setIsExporting(false);
              if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${useStore.getState().name}.wav`;
                  a.click();
                  URL.revokeObjectURL(url);
              } else {
                  alert("Failed to export WAV.");
              }
          }}
          disabled={isExporting}
          className={`p-2 rounded transition-colors ${isExporting ? 'text-blue-500 animate-pulse' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          title="Export WAV"
        >
          <Download size={20} />
        </button>
      </div>
    </header>
  );
}
