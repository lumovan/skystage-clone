'use client';

import { useState } from 'react';
import { Sparkles, Move, Zap, Wind, Waves, Circle, Grid3x3, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface TransitionEffect {
  id: string;
  type: 'fade' | 'morph' | 'explode' | 'swirl' | 'wave' | 'scatter' | 'spiral' | 'grid';
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  parameters: {
    intensity?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'center' | 'random';
    delay?: number;
    stagger?: number;
    rotation?: number;
    scale?: number;
  };
}

interface FormationTransitionsProps {
  onTransitionSelect: (transition: TransitionEffect) => void;
  currentTransition?: TransitionEffect;
  className?: string;
}

const TRANSITION_PRESETS: Array<{
  id: string;
  name: string;
  icon: React.ElementType;
  type: TransitionEffect['type'];
  description: string;
  defaultParams: TransitionEffect['parameters'];
}> = [
  {
    id: 'fade',
    name: 'Fade',
    icon: Sparkles,
    type: 'fade',
    description: 'Smooth crossfade between formations',
    defaultParams: { intensity: 0.5 }
  },
  {
    id: 'morph',
    name: 'Morph',
    icon: Move,
    type: 'morph',
    description: 'Drones smoothly move to new positions',
    defaultParams: { intensity: 0.7, direction: 'center' }
  },
  {
    id: 'explode',
    name: 'Explode',
    icon: Zap,
    type: 'explode',
    description: 'Burst outward then reform',
    defaultParams: { intensity: 1, direction: 'center', scale: 2 }
  },
  {
    id: 'swirl',
    name: 'Swirl',
    icon: Wind,
    type: 'swirl',
    description: 'Spiral transition effect',
    defaultParams: { intensity: 0.8, rotation: 360, direction: 'center' }
  },
  {
    id: 'wave',
    name: 'Wave',
    icon: Waves,
    type: 'wave',
    description: 'Wave-like motion transition',
    defaultParams: { intensity: 0.6, direction: 'left', stagger: 0.1 }
  },
  {
    id: 'scatter',
    name: 'Scatter',
    icon: Shuffle,
    type: 'scatter',
    description: 'Random scatter and regroup',
    defaultParams: { intensity: 0.9, direction: 'random', delay: 0.2 }
  },
  {
    id: 'spiral',
    name: 'Spiral',
    icon: Circle,
    type: 'spiral',
    description: 'Spiral in/out transition',
    defaultParams: { intensity: 0.7, rotation: 720, scale: 1.5 }
  },
  {
    id: 'grid',
    name: 'Grid',
    icon: Grid3x3,
    type: 'grid',
    description: 'Grid-based reorganization',
    defaultParams: { intensity: 0.5, stagger: 0.05 }
  }
];

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'elastic', label: 'Elastic' }
];

export default function FormationTransitions({
  onTransitionSelect,
  currentTransition,
  className
}: FormationTransitionsProps) {
  const [selectedPreset, setSelectedPreset] = useState(TRANSITION_PRESETS[0]);
  const [duration, setDuration] = useState(2);
  const [easing, setEasing] = useState<TransitionEffect['easing']>('ease-in-out');
  const [parameters, setParameters] = useState<TransitionEffect['parameters']>(
    TRANSITION_PRESETS[0].defaultParams
  );
  const [previewMode, setPreviewMode] = useState(false);

  const handlePresetSelect = (preset: typeof TRANSITION_PRESETS[0]) => {
    setSelectedPreset(preset);
    setParameters(preset.defaultParams);
  };

  const handleApply = () => {
    const transition: TransitionEffect = {
      id: `transition-${Date.now()}`,
      type: selectedPreset.type,
      duration,
      easing,
      parameters
    };

    onTransitionSelect(transition);
  };

  const handleParameterChange = ($1: unknown) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const generatePreviewPath = () => {
    // Generate SVG path for transition preview
    const points: string[] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let x = t * 100;
      let y = 50;

      // Apply easing
      switch (easing) {
        case 'ease-in':
          y = 50 - Math.pow(t, 2) * 30;
          break;
        case 'ease-out':
          y = 50 - (1 - Math.pow(1 - t, 2)) * 30;
          break;
        case 'ease-in-out':
          y = 50 - (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) * 30;
          break;
        case 'bounce':
          y = 50 - Math.abs(Math.sin(t * Math.PI * 2)) * 30;
          break;
        case 'elastic':
          y = 50 - Math.sin(t * Math.PI * 4) * Math.exp(-t * 2) * 30;
          break;
        default:
          y = 50 - t * 30;
      }

      points.push(`${x},${y}`);
    }

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className={cn("bg-gray-900 rounded-lg p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Transition Effects</h3>
        <Button
          size="sm"
          variant={previewMode ? 'default' : 'outline'}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Stop Preview' : 'Preview'}
        </Button>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-4 gap-2">
        {TRANSITION_PRESETS.map(preset => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                "p-3 rounded-lg border transition-all",
                selectedPreset.id === preset.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300"
              )}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs">{preset.name}</div>
            </button>
          );
        })}
      </div>

      {/* Description */}
      <div className="text-sm text-gray-400 bg-gray-800 rounded p-2">
        {selectedPreset.description}
      </div>

      {/* Easing Curve Preview */}
      <div className="bg-black rounded p-3">
        <svg width="100%" height="60" viewBox="0 0 100 60">
          <path
            d={generatePreviewPath()}
            fill="none"
            stroke="#00ffff"
            strokeWidth="2"
          />
          <circle cx="0" cy="50" r="3" fill="#00ffff" />
          <circle cx="100" cy="20" r="3" fill="#00ffff" />
        </svg>
      </div>

      {/* Duration Control */}
      <div className="space-y-2">
        <Label className="text-sm">Duration: {duration}s</Label>
        <Slider
          value={[duration]}
          min={0.5}
          max={10}
          step={0.5}
          onValueChange={(value) => setDuration(value[0])}
        />
      </div>

      {/* Easing Selection */}
      <div className="space-y-2">
        <Label className="text-sm">Easing</Label>
        <div className="grid grid-cols-3 gap-2">
          {EASING_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setEasing(option.value as TransitionEffect['easing'])}
              className={cn(
                "px-3 py-1 text-xs rounded",
                easing === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Parameters */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-300">Parameters</div>

        {parameters.intensity !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs">Intensity: {parameters.intensity}</Label>
            <Slider
              value={[parameters.intensity]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => handleParameterChange('intensity', value[0])}
            />
          </div>
        )}

        {parameters.rotation !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs">Rotation: {parameters.rotation}°</Label>
            <Slider
              value={[parameters.rotation]}
              min={0}
              max={720}
              step={45}
              onValueChange={(value) => handleParameterChange('rotation', value[0])}
            />
          </div>
        )}

        {parameters.scale !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs">Scale: {parameters.scale}x</Label>
            <Slider
              value={[parameters.scale]}
              min={0.5}
              max={3}
              step={0.1}
              onValueChange={(value) => handleParameterChange('scale', value[0])}
            />
          </div>
        )}

        {parameters.stagger !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs">Stagger: {parameters.stagger}s</Label>
            <Slider
              value={[parameters.stagger]}
              min={0}
              max={0.5}
              step={0.05}
              onValueChange={(value) => handleParameterChange('stagger', value[0])}
            />
          </div>
        )}

        {parameters.direction !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs">Direction</Label>
            <div className="grid grid-cols-3 gap-1">
              {['center', 'up', 'down', 'left', 'right', 'random'].map(dir => (
                <button
                  key={dir}
                  onClick={() => handleParameterChange('direction', dir)}
                  className={cn(
                    "px-2 py-1 text-xs rounded",
                    parameters.direction === dir
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  )}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <Button
        onClick={handleApply}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Apply Transition
      </Button>
    </div>
  );
}
