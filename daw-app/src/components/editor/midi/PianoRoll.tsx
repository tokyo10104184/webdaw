import { useStore } from '../../../lib/store/useStore';
import type { Note } from '../../../types/project';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

const NOTES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3, 2];
const CELL_WIDTH = 40; // width of a 16th note in pixels
const CELL_HEIGHT = 20;

export function PianoRoll({ trackId }: { trackId: string }) {
  const { tracks } = useStore();
  const track = tracks.find(t => t.id === trackId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create a local synth just for auditioning notes when clicking the keyboard
  const auditionSynth = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    auditionSynth.current = new Tone.PolySynth(Tone.Synth).toDestination();
    return () => {
      auditionSynth.current?.dispose();
    };
  }, []);

  useEffect(() => {
      if (auditionSynth.current && track?.type === 'midi') {
          auditionSynth.current.set({ oscillator: { type: track.synthType } });
      }
  }, [track?.type, (track as any)?.synthType]);

  if (!track || track.type !== 'midi') return null;

  const totalMeasures = 32; // Sync with Timeline.tsx length
  const sixteenthsPerMeasure = 16;
  const totalSixteenths = totalMeasures * sixteenthsPerMeasure;

  const handleGridClick = (noteStr: string, sixteenthIndex: number) => {
    const measure = Math.floor(sixteenthIndex / 16);
    const beat = Math.floor((sixteenthIndex % 16) / 4);
    const sixteenth = (sixteenthIndex % 16) % 4;
    const timeStr = `${measure}:${beat}:${sixteenth}`;

    // Play a preview sound
    auditionSynth.current?.triggerAttackRelease(noteStr, '16n');

    // Add note to store (we'll need an action for this)
    useStore.setState(state => {
      const newTracks = state.tracks.map(t => {
        if (t.id === trackId && t.type === 'midi') {
          // Check if note exists at this exact time to toggle it off
          const existingNoteIndex = t.notes.findIndex(n => n.time === timeStr && n.note === noteStr);
          if (existingNoteIndex >= 0) {
             const newNotes = [...t.notes];
             newNotes.splice(existingNoteIndex, 1);
             return { ...t, notes: newNotes };
          }

          const newNote: Note = {
            id: uuidv4(),
            time: timeStr,
            note: noteStr,
            duration: '16n'
          };
          return { ...t, notes: [...t.notes, newNote] };
        }
        return t;
      });
      return { tracks: newTracks };
    });
  };

  const playAudition = (note: string) => {
      auditionSynth.current?.triggerAttackRelease(note, '8n');
  }

  return (
    <div className="flex h-full w-full bg-zinc-900 overflow-hidden relative" ref={scrollRef}>

      {/* Piano Keyboard (Left) */}
      <div className="w-16 flex-shrink-0 bg-zinc-800 border-r border-zinc-700 z-10 sticky left-0 overflow-y-hidden" style={{ top: scrollRef.current?.scrollTop }}>
        {OCTAVES.map(octave => (
          NOTES.map(note => {
            const isBlack = note.includes('#');
            const noteName = `${note}${octave}`;
            return (
              <div
                key={noteName}
                onMouseDown={() => playAudition(noteName)}
                onTouchStart={(e) => {
                    e.preventDefault();
                    playAudition(noteName);
                }}
                className={`
                  w-full flex items-center justify-end pr-1 text-[8px] border-b border-zinc-700 cursor-pointer hover:bg-blue-500/50 active:bg-blue-500 touch-none select-none
                  ${isBlack ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-200 text-zinc-800'}
                `}
                style={{ height: CELL_HEIGHT }}
              >
                {!isBlack && noteName}
              </div>
            );
          })
        ))}
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto relative bg-zinc-900">

        {/* Timeline Ruler for Piano Roll */}
        <div className="h-6 sticky top-0 bg-zinc-900/90 border-b border-zinc-800 z-10 flex">
             {Array.from({ length: totalMeasures }).map((_, m) => (
                <div key={m} className="flex border-r border-zinc-700 h-full">
                    {Array.from({ length: 4 }).map((_, b) => (
                        <div key={b} className="border-r border-zinc-800/50 h-full flex items-end px-1" style={{ width: CELL_WIDTH * 4 }}>
                            {b === 0 && <span className="text-[10px] text-zinc-500">{m + 1}</span>}
                        </div>
                    ))}
                </div>
             ))}
        </div>

        {/* The Grid */}
        <div className="relative" style={{ width: totalSixteenths * CELL_WIDTH, height: OCTAVES.length * NOTES.length * CELL_HEIGHT }}>

          {/* Background alternating rows */}
          {OCTAVES.map((octave, oIdx) => (
            NOTES.map((note, nIdx) => (
              <div
                key={`bg-${note}${octave}`}
                className={`absolute w-full pointer-events-none border-b border-zinc-800/50 ${note.includes('#') ? 'bg-zinc-900/40' : 'bg-zinc-800/20'}`}
                style={{ top: (oIdx * NOTES.length + nIdx) * CELL_HEIGHT, height: CELL_HEIGHT }}
              />
            ))
          ))}

          {/* Grid vertical lines */}
          {Array.from({ length: totalSixteenths }).map((_, i) => (
             <div
                key={`vline-${i}`}
                className={`absolute top-0 bottom-0 pointer-events-none border-r ${i % 16 === 0 ? 'border-zinc-600' : i % 4 === 0 ? 'border-zinc-700' : 'border-zinc-800/30'}`}
                style={{ left: (i + 1) * CELL_WIDTH }}
             />
          ))}

          {/* Interaction layer */}
          {OCTAVES.map((octave, oIdx) => (
            NOTES.map((note, nIdx) => {
              const noteStr = `${note}${octave}`;
              const yPos = (oIdx * NOTES.length + nIdx) * CELL_HEIGHT;

              return Array.from({ length: totalSixteenths }).map((_, sIdx) => {
                 const xPos = sIdx * CELL_WIDTH;

                 // Check if note exists here
                 const measure = Math.floor(sIdx / 16);
                 const beat = Math.floor((sIdx % 16) / 4);
                 const sixteenth = (sIdx % 16) % 4;
                 const timeStr = `${measure}:${beat}:${sixteenth}`;
                 const hasNote = track.notes.some(n => n.time === timeStr && n.note === noteStr);

                 return (
                    <div
                      key={`cell-${noteStr}-${sIdx}`}
                      onMouseDown={() => handleGridClick(noteStr, sIdx)}
                      onTouchStart={(e) => {
                          e.preventDefault(); // Prevent scrolling while tapping grid
                          handleGridClick(noteStr, sIdx);
                      }}
                      className="absolute cursor-crosshair hover:bg-white/10 touch-none"
                      style={{ left: xPos, top: yPos, width: CELL_WIDTH, height: CELL_HEIGHT }}
                    >
                        {hasNote && (
                            <div className="absolute inset-0.5 bg-blue-500 rounded-sm border border-blue-400 shadow-sm pointer-events-none" />
                        )}
                    </div>
                 );
              });
            })
          ))}
        </div>
      </div>
    </div>
  );
}
