import { useStore } from '../../lib/store/useStore';

export function Timeline() {
  const { tracks, loopStartMeasure, loopEndMeasure, transportPosition } = useStore();

  const totalMeasures = 32;
  const measureWidth = 100; // pixels per measure

  return (
    <div className="flex-1 bg-zinc-900 relative overflow-x-auto flex flex-col h-full border-l border-zinc-800">

      {/* Ruler */}
      <div className="h-8 border-b border-zinc-800 bg-zinc-950 flex sticky top-0 z-10 w-[3200px]">
        {/* Loop Region Indicator */}
        <div
          className="absolute h-full bg-blue-500/20 border-l border-r border-blue-500/50 pointer-events-none"
          style={{
            left: loopStartMeasure * measureWidth,
            width: (loopEndMeasure - loopStartMeasure) * measureWidth
          }}
        />

        {Array.from({ length: totalMeasures }).map((_, i) => (
          <div
            key={i}
            className="h-full border-r border-zinc-800 text-[10px] text-zinc-500 font-mono px-1 flex items-end pb-1 select-none"
            style={{ width: measureWidth, minWidth: measureWidth }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Track Lanes */}
      <div className="flex-1 relative overflow-y-auto w-[3200px]">
        {tracks.map(track => (
          <div
            key={track.id}
            className="h-24 border-b border-zinc-800/50 flex relative hover:bg-zinc-800/20 transition-colors"
          >
            {/* Grid lines */}
             {Array.from({ length: totalMeasures }).map((_, i) => (
                <div
                  key={`grid-${i}`}
                  className="h-full border-r border-zinc-800/30 pointer-events-none absolute"
                  style={{ left: (i + 1) * measureWidth }}
                />
            ))}

            {/* Render MIDI Notes */}
            {track.type === 'midi' && track.notes.map(note => {
                const [measure, beat, sixteenth] = note.time.split(':').map(Number);
                const posInSixteenths = (measure * 16) + (beat * 4) + sixteenth;
                const left = posInSixteenths * (measureWidth / 16);
                const width = measureWidth / 16; // Assuming 16n length for now
                // Rough estimation of pitch to Y position
                const octave = parseInt(note.note.replace(/[^0-9]/g, '')) || 4;
                const top = 100 - (octave * 20); // Just a visual offset

                return (
                    <div
                        key={note.id}
                        className="absolute bg-blue-500/80 rounded-[1px] border border-blue-400"
                        style={{
                            left,
                            width,
                            height: '10px',
                            top: `${Math.max(10, Math.min(80, top))}%`
                        }}
                    />
                );
            })}

            {/* Render Audio Regions */}
            {track.type === 'audio' && track.regions.map(region => {
                const [measure, beat, sixteenth] = region.startTime.split(':').map(Number);
                const posInSixteenths = (measure * 16) + (beat * 4) + sixteenth;
                const left = posInSixteenths * (measureWidth / 16);

                // Assuming 120 BPM for visual width calculation.
                // In a real app, duration (sec) to pixels depends on current BPM.
                const secondsPerMeasure = (60 / 120) * 4;
                const pixelsPerSecond = measureWidth / secondsPerMeasure;
                const width = region.duration * pixelsPerSecond;

                return (
                    <div
                        key={region.id}
                        className="absolute bg-green-500/50 rounded-md border border-green-400/80 flex items-center overflow-hidden"
                        style={{
                            left,
                            width,
                            height: '80%',
                            top: '10%'
                        }}
                    >
                        {/* Fake waveform representation */}
                        <div className="w-full h-1/3 bg-green-400/50 mx-1 rounded-full"></div>
                    </div>
                );
            })}

            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-xs text-zinc-600 font-mono pointer-events-none">{track.name}</span>
            </div>
          </div>
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white z-20 pointer-events-none shadow-[0_0_4px_rgba(255,255,255,0.5)]"
          style={{
            // Calculate playhead position based on Tone.Transport position (measure:beat:sixteenth)
            // This is a rough estimation for UI purposes before implementing robust syncing
            left: (() => {
               const parts = transportPosition.split(':').map(Number);
               if (parts.length < 3) return 0;
               const [measure, beat, sixteenth] = parts;
               const beatsPerMeasure = 4; // Assuming 4/4
               const sixteenthsPerBeat = 4;
               const totalBeats = measure * beatsPerMeasure + beat + (sixteenth / sixteenthsPerBeat);
               // Each beat is measureWidth / 4 pixels
               return totalBeats * (measureWidth / 4);
            })()
          }}
        >
          {/* Playhead handle */}
          <div className="absolute -top-1 -left-1.5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-white" />
        </div>
      </div>
    </div>
  );
}
