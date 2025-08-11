'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface TimelineItem {
  id: string;
  formationId: string;
  name: string;
  startTime: number;
  duration: number;
  transition?: string;
  effects?: string[];
}

interface DronePreview3DProps {
  formations?: TimelineItem[];
  currentTime: number;
  isPlaying: boolean;
}

// Formation patterns for different shapes
const formationPatterns: Record<string, THREE.Vector3[]> = {
  heart: generateHeartFormation(100),
  ring: generateRingFormation(91),
  star: generateStarFormation(255),
  spiral: generateSpiralFormation(200),
  rose: generateRoseFormation(100),
  dahlia: generateDahliaFormation(50),
};

function generateHeartFormation(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const scale = 20;

  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const x = scale * 16 * Math.pow(Math.sin(t), 3);
    const z = scale * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    const y = Math.sin(i / count * Math.PI) * 10;
    positions.push(new THREE.Vector3(x / 10, y, -z / 10));
  }

  return positions;
}

function generateRingFormation(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const radius = 15;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(i / count * Math.PI * 4) * 2;
    positions.push(new THREE.Vector3(x, y, z));
  }

  return positions;
}

function generateStarFormation(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const points = 5;
  const innerRadius = 10;
  const outerRadius = 20;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * points;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 5;
    positions.push(new THREE.Vector3(x, y, z));
  }

  return positions;
}

function generateSpiralFormation(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const turns = 3;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 2 * turns;
    const radius = t * 20;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = t * 20 - 10;
    positions.push(new THREE.Vector3(x, y, z));
  }

  return positions;
}

function generateRoseFormation(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const k = 5/2;
  const scale = 15;

  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 4;
    const r = scale * Math.cos(k * theta);
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = Math.sin(i / count * Math.PI) * 5;
    positions.push(new THREE.Vector3(x, y, z));
  }

  return positions;
}

function generateDahliaFormation(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const petals = 8;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const petalAngle = angle * petals;
    const radius = 10 + 5 * Math.sin(petalAngle);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.cos(petalAngle) * 3;
    positions.push(new THREE.Vector3(x, y, z));
  }

  return positions;
}

export default function DronePreview3D({ formations = [], currentTime, isPlaying }: DronePreview3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const dronesRef = useRef<THREE.Group>();
  const particlesRef = useRef<THREE.Points[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 100, 500);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 30, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 200;
    controls.minDistance = 20;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Add point lights for dramatic effect
    const colors = [0xff00ff, 0x00ffff, 0xffff00];
    colors.forEach((color, i) => {
      const pointLight = new THREE.PointLight(color, 0.3, 100);
      pointLight.position.set(
        Math.cos((i / colors.length) * Math.PI * 2) * 40,
        20,
        Math.sin((i / colors.length) * Math.PI * 2) * 40
      );
      scene.add(pointLight);
    });

    // Ground grid
    const gridHelper = new THREE.GridHelper(200, 50, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Drone group
    const droneGroup = new THREE.Group();
    scene.add(droneGroup);
    dronesRef.current = droneGroup;

    // Create drones
    const droneGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const droneMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
    });

    // Initial formation (takeoff)
    for (let i = 0; i < 100; i++) {
      const drone = new THREE.Mesh(droneGeometry, droneMaterial.clone());
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      drone.position.set(x, 0, z);
      drone.castShadow = true;
      drone.receiveShadow = true;

      // Add glow effect
      const glowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      drone.add(glow);

      droneGroup.add(drone);
    }

    // Particle effects for trails
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 100;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = [particles];

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Animate drones based on current time
      if (dronesRef.current && isPlaying) {
        const time = currentTime;

        // Find current formation based on timeline
        let targetFormation = 'heart';
        if (formations.length > 0) {
          for (const formation of formations) {
            if (time >= formation.startTime && time < formation.startTime + formation.duration) {
              // Map formation names to patterns
              if (formation.name.toLowerCase().includes('heart')) targetFormation = 'heart';
              else if (formation.name.toLowerCase().includes('ring')) targetFormation = 'ring';
              else if (formation.name.toLowerCase().includes('star')) targetFormation = 'star';
              else if (formation.name.toLowerCase().includes('spiral')) targetFormation = 'spiral';
              else if (formation.name.toLowerCase().includes('rose')) targetFormation = 'rose';
              else if (formation.name.toLowerCase().includes('dahlia')) targetFormation = 'dahlia';
              break;
            }
          }
        }

        const targetPositions = formationPatterns[targetFormation] || formationPatterns.heart;

        dronesRef.current.children.forEach((drone, i) => {
          if (i < targetPositions.length) {
            const target = targetPositions[i];

            // Smooth lerp to target position
            drone.position.lerp(target, 0.05);

            // Add some oscillation
            drone.position.y += Math.sin(time * 2 + i * 0.1) * 0.1;

            // Rotate drones
            drone.rotation.y += 0.01;

            // Pulse emissive color
            const mesh = drone as THREE.Mesh;
            const material = mesh.material as THREE.MeshPhongMaterial;
            material.emissiveIntensity = 0.5 + Math.sin(time * 3 + i * 0.2) * 0.3;

            // Update glow
            if (drone.children[0]) {
              const glowMaterial = (drone.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
              glowMaterial.opacity = 0.3 + Math.sin(time * 3 + i * 0.2) * 0.2;
            }
          }
        });
      }

      // Animate particles
      particlesRef.current.forEach(particles => {
        particles.rotation.y += 0.001;
        const positions = particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 0.1;
          if (positions[i + 1] < -50) {
            positions[i + 1] = 50;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    setIsInitialized(true);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);

      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }

      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };
  }, []);

  // Update drone colors based on playing state
  useEffect(() => {
    if (!dronesRef.current) return;

    dronesRef.current.children.forEach(drone => {
      const mesh = drone as THREE.Mesh;
      const material = mesh.material as THREE.MeshPhongMaterial;
      material.emissive = new THREE.Color(isPlaying ? 0x00ff00 : 0x00ffff);
    });
  }, [isPlaying]);

  return (
    <div ref={mountRef} className="w-full h-full" />
  );
}
