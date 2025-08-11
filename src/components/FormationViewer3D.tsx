'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface DronePosition {
  x: number;
  y: number;
  z: number;
  color?: string;
}

interface FormationFrame {
  time: number;
  positions: DronePosition[];
}

interface FormationData {
  id: string;
  name: string;
  frames: FormationFrame[];
  duration: number;
  droneCount: number;
}

interface FormationViewer3DProps {
  formationData: FormationData;
  autoPlay?: boolean;
  showControls?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export default function FormationViewer3D({
  formationData,
  autoPlay = false,
  showControls = true,
  width = 800,
  height = 600,
  className = ''
}: FormationViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const dronesRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number>();

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controlsRef.current = controls;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Add grid
    const gridHelper = new THREE.GridHelper(100, 20, 0x333333, 0x333333);
    scene.add(gridHelper);

    // Create drone meshes
    createDroneMeshes();

    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [width, height]);

  // Create drone meshes
  const createDroneMeshes = () => {
    const scene = sceneRef.current;
    if (!scene || !formationData.frames.length) return;

    // Clear existing drones
    dronesRef.current.forEach(drone => scene.remove(drone));
    dronesRef.current = [];

    // Get max drone count across all frames
    const maxDrones = Math.max(...formationData.frames.map(frame => frame.positions.length));

    // Create drone geometry and materials
    const geometry = new THREE.SphereGeometry(0.5, 8, 6);

    for (let i = 0; i < maxDrones; i++) {
      const material = new THREE.MeshLambertMaterial({
        color: 0x00ff88,
        emissive: 0x002211
      });

      const drone = new THREE.Mesh(geometry, material);
      drone.visible = false; // Initially hidden
      scene.add(drone);
      dronesRef.current.push(drone);
    }
  };

  // Update drone positions for current frame
  const updateDronePositions = (time: number) => {
    if (!formationData.frames.length || !dronesRef.current.length) return;

    // Find the appropriate frame(s) for interpolation
    const frameIndex = formationData.frames.findIndex(frame => frame.time >= time);

    let currentFrame: FormationFrame;
    let nextFrame: FormationFrame | null = null;
    let lerpFactor = 0;

    if (frameIndex === -1) {
      // Use last frame
      currentFrame = formationData.frames[formationData.frames.length - 1];
    } else if (frameIndex === 0) {
      // Use first frame
      currentFrame = formationData.frames[0];
    } else {
      // Interpolate between frames
      currentFrame = formationData.frames[frameIndex - 1];
      nextFrame = formationData.frames[frameIndex];

      const timeDiff = nextFrame.time - currentFrame.time;
      if (timeDiff > 0) {
        lerpFactor = (time - currentFrame.time) / timeDiff;
      }
    }

    // Update each drone position
    dronesRef.current.forEach((drone, index) => {
      if (index < currentFrame.positions.length) {
        const currentPos = currentFrame.positions[index];

        if (nextFrame && index < nextFrame.positions.length && lerpFactor > 0) {
          // Interpolate position
          const nextPos = nextFrame.positions[index];
          drone.position.x = THREE.MathUtils.lerp(currentPos.x, nextPos.x, lerpFactor);
          drone.position.y = THREE.MathUtils.lerp(currentPos.y, nextPos.y, lerpFactor);
          drone.position.z = THREE.MathUtils.lerp(currentPos.z, nextPos.z, lerpFactor);
        } else {
          // Use current position
          drone.position.set(currentPos.x, currentPos.y, currentPos.z);
        }

        // Update color if specified
        if (currentPos.color) {
          const material = drone.material as THREE.MeshLambertMaterial;
          material.color.setHex(parseInt(currentPos.color.replace('#', '0x')));
        }

        drone.visible = true;
      } else {
        drone.visible = false;
      }
    });
  };

  // Animation loop
  const animate = () => {
    if (!isPlaying) return;

    const newTime = currentTime + (0.016 * playbackSpeed); // ~60fps

    if (newTime >= formationData.duration) {
      setCurrentTime(0);
      if (!autoPlay) {
        setIsPlaying(false);
      }
    } else {
      setCurrentTime(newTime);
    }

    animationIdRef.current = requestAnimationFrame(animate);
  };

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isPlaying, currentTime, playbackSpeed]);

  // Update drone positions when time changes
  useEffect(() => {
    updateDronePositions(currentTime);
  }, [currentTime, formationData]);

  // Render loop
  useEffect(() => {
    const renderLoop = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }, []);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleTimeSeek = (newTime: number) => {
    setCurrentTime(newTime);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 3D Viewer */}
      <div
        ref={mountRef}
        className="border border-gray-300 rounded-lg overflow-hidden"
        style={{ width, height }}
      />

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayback}
              className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
            >
              {isPlaying ? (
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              ) : (
                <div className="w-0 h-0 border-l-4 border-white border-y-2 border-y-transparent ml-1"></div>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={resetAnimation}
              className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
            >
              <div className="w-4 h-4 border-2 border-white rounded-full relative">
                <div className="absolute -top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-white transform rotate-45"></div>
              </div>
            </button>

            {/* Time Slider */}
            <div className="flex-1 mx-4">
              <input
                type="range"
                min={0}
                max={formationData.duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleTimeSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>{currentTime.toFixed(1)}s</span>
                <span>{formationData.duration.toFixed(1)}s</span>
              </div>
            </div>

            {/* Speed Control */}
            <div className="flex items-center space-x-2">
              <span className="text-xs">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-white bg-opacity-20 text-white text-xs rounded px-2 py-1"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>
          </div>

          {/* Formation Info */}
          <div className="mt-2 text-xs opacity-75">
            <span>{formationData.name}</span>
            <span className="mx-2">•</span>
            <span>{formationData.droneCount} drones</span>
            <span className="mx-2">•</span>
            <span>{formationData.duration.toFixed(1)}s duration</span>
          </div>
        </div>
      )}
    </div>
  );
}
