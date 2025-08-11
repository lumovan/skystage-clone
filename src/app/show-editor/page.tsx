'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Formation timeline component
function Timeline({ formations, currentTime, onTimeChange, duration = 300 }) {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-gray-900 border-t border-gray-700 p-4">
      <div className="flex items-center space-x-4 mb-2">
        <button className="text-white hover:text-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <div className="text-white text-sm">
          {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative bg-gray-800 h-20 rounded-lg overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = x / rect.width;
          onTimeChange(percentage * duration);
        }}
      >
        {/* Time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Formation blocks */}
        {formations.map((formation, index) => (
          <div
            key={index}
            className="absolute top-2 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded opacity-80 flex items-center justify-center"
            style={{
              left: `${(formation.startTime / duration) * 100}%`,
              width: `${(formation.duration / duration) * 100}%`
            }}
          >
            <span className="text-white text-xs truncate px-2">{formation.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Drone visualization component
function DroneSwarm({ formations, currentTime }) {
  const groupRef = useRef<THREE.Group>(null);
  const [drones, setDrones] = useState<any[]>([]);

  useEffect(() => {
    // Find current formation based on time
    const currentFormation = formations.find(f =>
      currentTime >= f.startTime && currentTime < f.startTime + f.duration
    );

    if (currentFormation) {
      // Generate drone positions based on formation
      const newDrones = [];
      const count = currentFormation.droneCount || 100;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = currentFormation.pattern === 'circle' ? 10 : 5 + Math.random() * 10;

        newDrones.push({
          position: [
            Math.cos(angle) * radius,
            Math.sin(angle) * radius / 2 + Math.random() * 5,
            Math.sin(angle) * radius
          ],
          color: currentFormation.color || '#00ffff'
        });
      }

      setDrones(newDrones);
    }
  }, [formations, currentTime]);

  return (
    <group ref={groupRef}>
      {drones.map((drone, index) => (
        <mesh key={index} position={drone.position}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial
            color={drone.color}
            emissive={drone.color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// Formation library sidebar
function FormationLibrary({ onAddFormation }) {
  const [formations, setFormations] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // Fetch formations from API
    fetch('/api/formations')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFormations(data.data);
        }
      });
  }, []);

  const categories = ['All', 'Epic', 'Love', 'Nature', 'Abstract', 'Entertainment', 'Sports', 'Holidays', 'Corporate'];
  const filteredFormations = selectedCategory === 'All'
    ? formations
    : formations.filter(f => f.category === selectedCategory);

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-bold mb-3">Formation Library</h3>
        <input
          type="text"
          placeholder="Search formations..."
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 p-4 border-b border-gray-700">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredFormations.slice(0, 20).map(formation => (
            <div
              key={formation.id}
              className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => onAddFormation(formation)}
            >
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded mb-2" />
              <h4 className="text-white text-sm font-medium truncate">{formation.name}</h4>
              <div className="flex items-center text-gray-400 text-xs mt-1">
                <span>{formation.drone_count} drones</span>
                <span className="mx-1">•</span>
                <span>{formation.duration}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Show Editor Component
export default function ShowEditorPage() {
  const [showFormations, setShowFormations] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showName, setShowName] = useState('Untitled Show');
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - currentTime * 1000;

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        setCurrentTime(elapsed);

        if (elapsed < 300) { // 5 minute max duration
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime]);

  const handleAddFormation = (formation) => {
    const lastFormation = showFormations[showFormations.length - 1];
    const startTime = lastFormation
      ? lastFormation.startTime + lastFormation.duration
      : 0;

    setShowFormations([...showFormations, {
      ...formation,
      startTime,
      duration: formation.duration || 30,
      droneCount: formation.drone_count || 100,
      pattern: 'circle',
      color: '#00ffff'
    }]);
  };

  const handleExport = async (format: string) => {
    const exportData = {
      name: showName,
      formations: showFormations,
      duration: Math.max(...showFormations.map(f => f.startTime + f.duration), 300),
      format
    };

    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData)
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${showName}.${format}`;
      a.click();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <input
            type="text"
            value={showName}
            onChange={(e) => setShowName(e.target.value)}
            className="bg-transparent text-white text-xl font-medium focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            {isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Preview</span>
              </>
            )}
          </button>

          <div className="relative">
            <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg hidden">
              <button onClick={() => handleExport('blend')} className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700">Export to Blender</button>
              <button onClick={() => handleExport('skybrush')} className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700">Export to SkyBrush</button>
              <button onClick={() => handleExport('csv')} className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700">Export as CSV</button>
              <button onClick={() => handleExport('dss')} className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700">Export as DSS</button>
            </div>
          </div>

          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Save Show
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Formation Library Sidebar */}
        <FormationLibrary onAddFormation={handleAddFormation} />

        {/* 3D Viewport */}
        <div className="flex-1 relative">
          <Canvas>
            <PerspectiveCamera makeDefault position={[30, 30, 30]} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <Grid
              args={[100, 100]}
              cellSize={5}
              cellThickness={0.5}
              cellColor="#444444"
              sectionSize={10}
              sectionThickness={1}
              sectionColor="#666666"
              fadeDistance={100}
              fadeStrength={1}
              followCamera={false}
            />

            <Stars />

            <Suspense fallback={null}>
              <DroneSwarm formations={showFormations} currentTime={currentTime} />
            </Suspense>
          </Canvas>

          {/* Playback controls overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentTime(0)}
                className="text-white hover:text-blue-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-blue-400"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                )}
              </button>

              <div className="text-white text-sm">
                {Math.floor(currentTime)}s
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 p-4">
          <h3 className="text-white font-bold mb-4">Show Properties</h3>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Total Duration</label>
              <div className="text-white">
                {Math.floor(Math.max(...showFormations.map(f => f.startTime + f.duration), 0) / 60)}:{(Math.max(...showFormations.map(f => f.startTime + f.duration), 0) % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Formations</label>
              <div className="text-white">{showFormations.length}</div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Max Drones</label>
              <div className="text-white">
                {Math.max(...showFormations.map(f => f.droneCount), 0)}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-white font-medium mb-3">Formation Sequence</h4>
            <div className="space-y-2">
              {showFormations.map((formation, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">{formation.name}</span>
                    <button className="text-gray-400 hover:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {Math.floor(formation.startTime)}s - {Math.floor(formation.startTime + formation.duration)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Timeline
        formations={showFormations}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
        duration={300}
      />
    </div>
  );
}
