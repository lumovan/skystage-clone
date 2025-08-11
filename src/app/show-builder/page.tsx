'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Eye, EyeOff, Maximize2, Download, Upload, Plus,
  ChevronLeft, Search, Filter, Grid, List, Clock,
  Sparkles, Music, Layers, Move, Trash2, Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import Three.js components to avoid SSR issues
const DronePreview3D = dynamic(() => import('@/components/DronePreview3D'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
});

interface Formation {
  id: string;
  name: string;
  thumbnail: string;
  drones: number;
  duration: number;
  category: string;
}

interface TimelineItem {
  id: string;
  formationId: string;
  name: string;
  startTime: number;
  duration: number;
  transition?: string;
  effects?: string[];
}

const categories = [
  { id: 'wedding', name: 'Wedding', icon: '💍', count: 74 },
  { id: 'proposal', name: 'Proposal', icon: '💝', count: 52 },
  { id: 'epic', name: 'Epic', icon: '🔥', count: 120 },
  { id: 'christmas', name: 'Christmas', icon: '🎄', count: 48 },
];

const sampleFormations: Formation[] = [
  { id: '1', name: 'Beating Heart', thumbnail: '/assets/formations/beating-heart.jpg', drones: 100, duration: 47.92, category: 'wedding' },
  { id: '2', name: 'Starry Night', thumbnail: '/assets/formations/starry-night.jpg', drones: 255, duration: 10.38, category: 'epic' },
  { id: '3', name: 'Ring Coming Out', thumbnail: '/assets/formations/ring-from-box.jpg', drones: 91, duration: 60.0, category: 'proposal' },
  { id: '4', name: 'Unfolding Rose', thumbnail: '/assets/formations/unfolding-rose.jpg', drones: 100, duration: 20.83, category: 'wedding' },
  { id: '5', name: 'Spiral', thumbnail: '/assets/formations/spiral.jpg', drones: 200, duration: 34.0, category: 'epic' },
  { id: '6', name: 'Dahlia', thumbnail: '/assets/formations/dahlia.jpg', drones: 50, duration: 32.04, category: 'wedding' },
];

function ShowBuilderContent() {
  const searchParams = useSearchParams();
  const showId = searchParams.get('show');

  const [selectedCategory, setSelectedCategory] = useState('wedding');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showDuration, setShowDuration] = useState(300); // 5 minutes default
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
    { id: 't1', formationId: '0', name: 'Takeoff', startTime: 0, duration: 10 },
    { id: 't2', formationId: '1', name: 'Drone Triangle For...', startTime: 10, duration: 30, transition: 'fade' },
    { id: 't3', formationId: '2', name: 'Transition...', startTime: 40, duration: 10, transition: 'morph' },
    { id: 't4', formationId: '3', name: 'Infinity', startTime: 50, duration: 45 },
    { id: 't5', formationId: '4', name: 'Champagne Glasses', startTime: 95, duration: 60 },
  ]);
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);
  const [theaterMode, setTheaterMode] = useState(false);
  const [showEffectStack, setShowEffectStack] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Filter formations based on category and search
  const filteredFormations = sampleFormations.filter(f => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Playback control
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - currentTime * 1000;

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;

        if (elapsed >= showDuration) {
          setIsPlaying(false);
          setCurrentTime(showDuration);
        } else {
          setCurrentTime(elapsed);
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, showDuration]);

  const handleDragStart = (e: React.DragEvent, formation: Formation) => {
    e.dataTransfer.setData('formation', JSON.stringify(formation));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const formation = JSON.parse(e.dataTransfer.getData('formation'));

    // Calculate drop position on timeline
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const timePosition = (x / rect.width) * showDuration;

      const newItem: TimelineItem = {
        id: `t${Date.now()}`,
        formationId: formation.id,
        name: formation.name,
        startTime: Math.max(0, timePosition),
        duration: formation.duration,
        effects: []
      };

      setTimelineItems([...timelineItems, newItem].sort((a, b) => a.startTime - b.startTime));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gray-950 border-b border-gray-800 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <ChevronLeft className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            </Link>
            <span className="text-sm text-gray-400">View show page</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs">
              We are in public beta. Please contact us at hello@skystage.com to report bugs!
            </div>
            <Button
              variant="outline"
              className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Blender
            </Button>
            <Button className="bg-white text-black hover:bg-gray-200">
              Direct Export
            </Button>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-screen pt-[60px]">
        {/* Left Sidebar - Formation Library */}
        <div className={cn(
          "w-80 bg-gray-950 border-r border-gray-800 overflow-hidden flex flex-col",
          theaterMode && "hidden"
        )}>
          {/* Library Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Formation library</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1 rounded",
                    viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1 rounded",
                    viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all formations..."
                className="pl-10 bg-gray-900 border-gray-800 text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b border-gray-800">
            <div className="text-xs text-gray-500 mb-2">{filteredFormations.length} formations found</div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-colors",
                    selectedCategory === cat.id
                      ? 'bg-gray-800 text-white'
                      : 'hover:bg-gray-900 text-gray-400'
                  )}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-xs">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formations Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className={cn(
              viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-2"
            )}>
              {filteredFormations.map(formation => (
                <div
                  key={formation.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, formation)}
                  className={cn(
                    "bg-gray-900 rounded-lg overflow-hidden cursor-move hover:ring-2 hover:ring-blue-500 transition-all",
                    viewMode === 'list' && "flex items-center gap-3 p-2"
                  )}
                >
                  <img
                    src={formation.thumbnail}
                    alt={formation.name}
                    className={cn(
                      "object-cover",
                      viewMode === 'grid' ? "w-full h-24" : "w-16 h-16 rounded"
                    )}
                  />
                  <div className={cn(
                    viewMode === 'grid' ? "p-2" : "flex-1"
                  )}>
                    <div className="text-xs font-medium truncate">{formation.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{formation.drones}</span>
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{formation.duration}s</span>
                    </div>
                  </div>
                  <div className="flex gap-1 p-2">
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Formation Section */}
          <div className="p-4 border-t border-gray-800">
            <Button className="w-full bg-gray-900 hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Create Formation
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {/* 3D Preview Area */}
          <div className="flex-1 relative bg-black">
            {showEffectStack && (
              <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur rounded-lg p-4 z-10">
                <div className="text-sm font-medium mb-3">Effect Stack</div>
                <div className="space-y-2">
                  <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white">
                    <Sparkles className="w-3 h-3" />
                    Add Lighting Effect
                  </button>
                  <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white">
                    <Move className="w-3 h-3" />
                    Add Motion
                  </button>
                  <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white">
                    <Layers className="w-3 h-3" />
                    Add Transform
                  </button>
                </div>
                {timelineItems.length === 0 && (
                  <div className="mt-4 text-xs text-gray-500">
                    No stacked effects added yet. Click 'Add Lighting Effect' to get started.
                  </div>
                )}
              </div>
            )}

            {/* 3D Drone Preview */}
            <div className="w-full h-full">
              <DronePreview3D
                formations={timelineItems}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
            </div>

            {/* Preview Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900/90 backdrop-blur rounded-full px-4 py-2">
              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setCurrentTime(showDuration)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setTheaterMode(!theaterMode)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-gray-900 border-t border-gray-800">
            {/* Timeline Controls */}
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setTheaterMode(!theaterMode)}
                >
                  Theater mode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Reorder formations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setShowEffectStack(!showEffectStack)}
                >
                  {showEffectStack ? 'Hide' : 'Show'} Effect Stack
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="bg-gray-800 hover:bg-gray-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Add Lighting Effect
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div
              ref={timelineRef}
              className="relative h-32 bg-gray-950 overflow-x-auto"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Time Ruler */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-gray-900 border-b border-gray-800 flex items-center">
                {Array.from({ length: Math.ceil(showDuration / 30) }).map((_, i) => (
                  <div key={i} className="flex-shrink-0" style={{ width: '200px' }}>
                    <span className="text-xs text-gray-500 ml-1">{formatTime(i * 30)}</span>
                  </div>
                ))}
              </div>

              {/* Timeline Items */}
              <div className="absolute top-8 left-0 right-0 bottom-0">
                {timelineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "absolute h-16 bg-gradient-to-r rounded cursor-pointer transition-all",
                      selectedTimeline === item.id
                        ? "ring-2 ring-blue-500 from-blue-600 to-blue-700"
                        : "from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700"
                    )}
                    style={{
                      left: `${(item.startTime / showDuration) * 100}%`,
                      width: `${(item.duration / showDuration) * 100}%`,
                      top: '8px'
                    }}
                    onClick={() => setSelectedTimeline(item.id)}
                  >
                    <div className="p-2 text-xs">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-gray-400">{item.duration}s</div>
                    </div>
                    {item.transition && (
                      <div className="absolute -left-px top-0 bottom-0 w-1 bg-yellow-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Playhead */}
              <div
                className="absolute top-6 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${(currentTime / showDuration) * 100}%` }}
              >
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full" />
              </div>
            </div>

            {/* Music Track */}
            <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-800">
              <Music className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">
                No music track added to this show. Use the left hand panel to add one!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShowBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <ShowBuilderContent />
    </Suspense>
  );
}
