import { useEffect, useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { TrackList } from './components/layout/TrackList';
import { Timeline } from './components/layout/Timeline';
import { BottomEditor } from './components/layout/BottomEditor';
import { audioEngine } from './lib/audio/engine';
import { playbackEngine } from './lib/audio/playback';
import { audioRecorderEngine } from './lib/audio/record/recorder';
import { useStore } from './lib/store/useStore';
import * as Tone from 'tone';

function App() {
  const [isLandscape, setIsLandscape] = useState(true);
  const { updateTransportPosition, isPlaying } = useStore();

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Initialize audio engine on first interaction (browser requirement)
  useEffect(() => {
    const initAudio = async () => {
      await audioEngine.init();
      // Access playbackEngine to ensure it initializes its subscriptions
      // @ts-ignore
      const _ = playbackEngine;
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  // Sync Tone.Transport position to React state for UI updates
  // Handle Recording start/stop based on global state
  useEffect(() => {
     const unsub = useStore.subscribe((newState, prevState) => {
         if (newState.isRecording && !prevState.isRecording) {
             audioRecorderEngine.requestPermissions().then(granted => {
                 if (granted) audioRecorderEngine.startRecording();
                 else useStore.setState({ isRecording: false });
             });
         } else if (!newState.isRecording && prevState.isRecording) {
             audioRecorderEngine.stopRecording();
         }
     });
     return unsub;
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      if (Tone.Transport.state === 'started') {
        updateTransportPosition(audioEngine.getTransportPosition());
        animationFrameId = requestAnimationFrame(updatePosition);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updatePosition);
    } else {
      cancelAnimationFrame(animationFrameId!);
      // Update one last time when stopped
      updateTransportPosition(audioEngine.getTransportPosition());
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, updateTransportPosition]);

  if (!isLandscape) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-900 text-center p-8">
        <div className="text-4xl mb-4 text-zinc-400">📱➡️💻</div>
        <h1 className="text-2xl font-bold text-white mb-2">Please Rotate Your Device</h1>
        <p className="text-zinc-400">
          This application is designed to be used in landscape mode for the best experience.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-900 text-zinc-100 overflow-hidden relative font-sans">
      <TopBar />
      <main className="flex-1 flex overflow-hidden">
        <TrackList />
        <Timeline />
      </main>
      <BottomEditor />
    </div>
  );
}

export default App;
