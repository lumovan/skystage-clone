'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Upload, Play, Pause, Volume2, Waveform, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface MusicSyncProps {
  onBeatDetected?: (time: number, intensity: number) => void;
  onMusicLoaded?: (duration: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

interface Beat {
  time: number;
  intensity: number;
  frequency: 'bass' | 'mid' | 'treble';
}

export default function MusicSync({
  onBeatDetected,
  onMusicLoaded,
  onTimeUpdate,
  className
}: MusicSyncProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize audio context
  const initializeAudioContext = useCallback(async () => {
    if (!audioRef.current || audioContextRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    sourceRef.current = source;
  }, []);

  // Beat detection algorithm
  const detectBeats = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Divide frequency spectrum into bands
    const bassEnd = Math.floor(bufferLength * 0.1);
    const midEnd = Math.floor(bufferLength * 0.5);

    // Calculate average intensity for each band
    let bassSum = 0, midSum = 0, trebleSum = 0;

    for (let i = 0; i < bassEnd; i++) {
      bassSum += dataArray[i];
    }
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += dataArray[i];
    }
    for (let i = midEnd; i < bufferLength; i++) {
      trebleSum += dataArray[i];
    }

    const bassAvg = bassSum / bassEnd;
    const midAvg = midSum / (midEnd - bassEnd);
    const trebleAvg = trebleSum / (bufferLength - midEnd);

    // Detect significant peaks (beats)
    const threshold = 180; // Adjust for sensitivity
    const currentTimeMs = audioRef.current?.currentTime || 0;

    if (bassAvg > threshold) {
      const beat: Beat = {
        time: currentTimeMs,
        intensity: bassAvg / 255,
        frequency: 'bass'
      };

      // Avoid duplicate beats
      const lastBeat = beats[beats.length - 1];
      if (!lastBeat || currentTimeMs - lastBeat.time > 0.1) {
        setBeats(prev => [...prev, beat]);
        onBeatDetected?.(beat.time, beat.intensity);
      }
    }

    // Update waveform visualization
    const waveform = Array.from(dataArray).filter((_, i) => i % 4 === 0);
    setWaveformData(waveform);
  }, [beats, onBeatDetected]);

  // Visualize waveform
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw waveform
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / waveformData.length;
    let x = 0;

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i] / 255;
      const y = v * canvas.height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Draw beat markers
    ctx.fillStyle = '#ff00ff';
    beats.forEach(beat => {
      const x = (beat.time / duration) * canvas.width;
      const height = beat.intensity * canvas.height;
      ctx.fillRect(x - 1, canvas.height - height, 2, height);
    });
  }, [waveformData, beats, duration]);

  // Animation loop
  const animate = useCallback(() => {
    detectBeats();
    drawWaveform();

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [detectBeats, drawWaveform, isPlaying]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setIsAnalyzing(true);

    const url = URL.createObjectURL(file);

    if (audioRef.current) {
      audioRef.current.src = url;
      await audioRef.current.load();

      // Initialize audio context on user interaction
      await initializeAudioContext();

      setDuration(audioRef.current.duration);
      onMusicLoaded?.(audioRef.current.duration);
      setIsAnalyzing(false);
    }
  };

  // Playback controls
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      animate();
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const time = value[0];
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const vol = value[0];
    audioRef.current.volume = vol;
    setVolume(vol);
  };

  // Auto-sync beats to timeline
  const syncBeatsToTimeline = useCallback(() => {
    // Group beats into measures (assuming 4/4 time)
    const bpm = 120; // Auto-detect or allow manual input
    const beatInterval = 60 / bpm;
    const measures: Array<{ start: number; beats: Beat[] }> = [];

    let currentMeasure: Beat[] = [];
    let measureStart = 0;

    beats.forEach(beat => {
      if (beat.time - measureStart > beatInterval * 4) {
        if (currentMeasure.length > 0) {
          measures.push({ start: measureStart, beats: currentMeasure });
        }
        currentMeasure = [beat];
        measureStart = beat.time;
      } else {
        currentMeasure.push(beat);
      }
    });

    if (currentMeasure.length > 0) {
      measures.push({ start: measureStart, beats: currentMeasure });
    }

    return measures;
  }, [beats]);

  // Update time
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTimeUpdate = () => {
      const time = audioRef.current!.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [onTimeUpdate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("bg-gray-900 rounded-lg p-4", className)}>
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Music Sync</h3>
        </div>

        {audioFile && (
          <button
            onClick={() => {
              setAudioFile(null);
              setBeats([]);
              setIsPlaying(false);
              if (audioRef.current) {
                audioRef.current.src = '';
              }
            }}
            className="p-1 hover:bg-gray-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!audioFile ? (
        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
          <Upload className="w-8 h-8 text-gray-500 mb-2" />
          <span className="text-sm text-gray-400">Upload Music Track</span>
          <span className="text-xs text-gray-500">MP3, WAV, OGG</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      ) : (
        <>
          {/* Waveform Visualization */}
          <div className="relative h-24 bg-black rounded mb-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={96}
              className="w-full h-full"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-sm text-white">Analyzing audio...</div>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
              </div>

              <span className="text-xs text-gray-400 min-w-[80px] text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            {/* Beat Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Detected Beats: {beats.length}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const measures = syncBeatsToTimeline();
                  console.log('Synced measures:', measures);
                  // Send to timeline
                }}
                className="text-xs"
              >
                <Waveform className="w-3 h-3 mr-1" />
                Sync to Timeline
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
