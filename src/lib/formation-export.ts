/**
 * Formation Export Utilities
 * Handles exporting drone formations to different formats:
 * - Blender (.blend, .csv)
 * - Skybrush (.skyc)
 * - DSS (Drone Show Software)
 * - Universal formats (.json, .csv)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { SkystageFormation } from './skystage-client';

export interface DronePosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  color?: string;
  brightness?: number;
}

export interface FormationFrame {
  time: number;
  positions: DronePosition[];
}

export interface ExportFormation {
  id: string;
  name: string;
  description: string;
  frames: FormationFrame[];
  droneCount: number;
  duration: number;
  fps: number;
  metadata?: {
    creator?: string;
    created_at?: string;
    tags?: string[];
    music_file?: string;
  };
}

export interface ExportOptions {
  format: 'blender' | 'skybrush' | 'dss' | 'csv' | 'json';
  includeColors?: boolean;
  frameRate?: number;
  coordinateSystem?: 'xyz' | 'ned' | 'enu';
  scaleFactor?: number;
  centerOrigin?: boolean;
  outputPath?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: {
    fileSize: number;
    frameCount: number;
    droneCount: number;
    duration: number;
  };
}

class FormationExporter {
  private tempDir: string;

  constructor() {
    this.tempDir = process.env.EXPORT_TEMP_DIR || path.join(process.cwd(), 'temp', 'exports');
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create temp directory:', error);
    }
  }

  /**
   * Export formation to specified format
   */
  async exportFormation(
    formation: ExportFormation,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Ensure temp directory exists
      await this.ensureTempDir();

      // Pre-process formation data
      const processedFormation = this.preprocessFormation(formation, options);

      // Export based on format
      switch (options.format) {
        case 'blender':
          return await this.exportToBlender(processedFormation, options);
        case 'skybrush':
          return await this.exportToSkybrush(processedFormation, options);
        case 'dss':
          return await this.exportToDSS(processedFormation, options);
        case 'csv':
          return await this.exportToCSV(processedFormation, options);
        case 'json':
          return await this.exportToJSON(processedFormation, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pre-process formation data based on options
   */
  private preprocessFormation(
    formation: ExportFormation,
    options: ExportOptions
  ): ExportFormation {
    const processed = { ...formation };

    // Apply coordinate system transformation
    if (options.coordinateSystem && options.coordinateSystem !== 'xyz') {
      processed.frames = processed.frames.map(frame => ({
        ...frame,
        positions: frame.positions.map(pos =>
          this.transformCoordinates(pos, 'xyz', options.coordinateSystem!)
        )
      }));
    }

    // Apply scale factor
    if (options.scaleFactor && options.scaleFactor !== 1) {
      processed.frames = processed.frames.map(frame => ({
        ...frame,
        positions: frame.positions.map(pos => ({
          ...pos,
          x: pos.x * options.scaleFactor!,
          y: pos.y * options.scaleFactor!,
          z: pos.z * options.scaleFactor!
        }))
      }));
    }

    // Center origin if requested
    if (options.centerOrigin) {
      processed.frames = this.centerFormationOrigin(processed.frames);
    }

    return processed;
  }

  /**
   * Transform coordinates between different systems
   */
  private transformCoordinates(
    pos: DronePosition,
    from: string,
    to: string
  ): DronePosition {
    if (from === to) return pos;

    let { x, y, z } = pos;

    // Convert from source to standard (XYZ)
    if (from === 'ned') {
      // NED: North-East-Down to XYZ
      [x, y, z] = [y, x, -z];
    } else if (from === 'enu') {
      // ENU: East-North-Up to XYZ
      [x, y, z] = [x, y, z];
    }

    // Convert from standard to target
    if (to === 'ned') {
      // XYZ to NED: North-East-Down
      [x, y, z] = [y, x, -z];
    } else if (to === 'enu') {
      // XYZ to ENU: East-North-Up
      [x, y, z] = [x, y, z];
    }

    return { ...pos, x, y, z };
  }

  /**
   * Center the formation around origin
   */
  private centerFormationOrigin(frames: FormationFrame[]): FormationFrame[] {
    if (!frames.length) return frames;

    // Calculate bounds across all frames
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    frames.forEach(frame => {
      frame.positions.forEach(pos => {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        minZ = Math.min(minZ, pos.z);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
        maxZ = Math.max(maxZ, pos.z);
      });
    });

    // Calculate center offset
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Apply offset to all positions
    return frames.map(frame => ({
      ...frame,
      positions: frame.positions.map(pos => ({
        ...pos,
        x: pos.x - centerX,
        y: pos.y - centerY,
        z: pos.z - centerZ
      }))
    }));
  }

  /**
   * Export to Blender-compatible format
   */
  private async exportToBlender(
    formation: ExportFormation,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `${formation.name.replace(/[^a-zA-Z0-9]/g, '_')}_blender.py`;
    const filePath = path.join(this.tempDir, fileName);

    // Generate Blender Python script
    const blenderScript = this.generateBlenderScript(formation, options);

    await fs.writeFile(filePath, blenderScript);

    // Also create a CSV data file
    const csvFileName = `${formation.name.replace(/[^a-zA-Z0-9]/g, '_')}_data.csv`;
    const csvFilePath = path.join(this.tempDir, csvFileName);
    const csvData = this.generateFormationCSV(formation, options);

    await fs.writeFile(csvFilePath, csvData);

    const stats = await fs.stat(filePath);

    return {
      success: true,
      filePath,
      metadata: {
        fileSize: stats.size,
        frameCount: formation.frames.length,
        droneCount: formation.droneCount,
        duration: formation.duration
      }
    };
  }

  /**
   * Generate Blender Python script
   */
  private generateBlenderScript(formation: ExportFormation, options: ExportOptions): string {
    return `
import bpy
import bmesh
import csv
import os
from mathutils import Vector

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)

# Formation data
formation_name = "${formation.name}"
drone_count = ${formation.droneCount}
duration = ${formation.duration}
fps = ${formation.fps || 24}

# Create collection for drones
collection = bpy.data.collections.new(f"{formation.name}_Drones")
bpy.context.scene.collection.children.link(collection)

# Create drone objects
drones = []
for i in range(drone_count):
    # Create drone mesh (sphere)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(0, 0, 0))
    drone = bpy.context.active_object
    drone.name = f"Drone_{i:03d}"

    # Move to collection
    bpy.context.scene.collection.objects.unlink(drone)
    collection.objects.link(drone)

    # Create material for drone
    material = bpy.data.materials.new(name=f"Drone_Material_{i:03d}")
    material.use_nodes = True

    # Set emission shader for LED effect
    nodes = material.node_tree.nodes
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.0, 1.0, 0.0, 1.0)  # Green
    emission.inputs['Strength'].default_value = 2.0

    output = nodes.get('Material Output')
    material.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])

    drone.data.materials.append(material)
    drones.append(drone)

# Set frame range
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = int(duration * fps)

# Animation data
${this.generateBlenderAnimationData(formation)}

# Set playback
bpy.context.scene.frame_set(1)

print(f"Drone show '{formation_name}' created successfully!")
print(f"Drones: {drone_count}")
print(f"Duration: {duration} seconds")
print(f"Frames: {int(duration * fps)}")
`;
  }

  /**
   * Generate Blender animation keyframes
   */
  private generateBlenderAnimationData(formation: ExportFormation): string {
    let animationCode = '# Keyframe animation data\n';

    formation.frames.forEach((frame, frameIndex) => {
      const frameNumber = Math.round(frame.time * (formation.fps || 24)) + 1;

      frame.positions.forEach((pos, droneIndex) => {
        if (droneIndex < formation.droneCount) {
          animationCode += `
# Frame ${frameIndex + 1}, Drone ${droneIndex}
if ${droneIndex} < len(drones):
    drone = drones[${droneIndex}]
    drone.location = (${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)})
    drone.keyframe_insert(data_path="location", frame=${frameNumber})
`;

          // Add color animation if available
          if (pos.color) {
            const color = this.hexToRgb(pos.color);
            animationCode += `
    # Color animation
    if drone.data.materials:
        material = drone.data.materials[0]
        if material.node_tree:
            emission_node = material.node_tree.nodes.get('Emission')
            if emission_node:
                emission_node.inputs['Color'].default_value = (${color.r}, ${color.g}, ${color.b}, 1.0)
                emission_node.inputs['Color'].keyframe_insert(data_path="default_value", frame=${frameNumber})
`;
          }
        }
      });
    });

    return animationCode;
  }

  /**
   * Export to Skybrush format
   */
  private async exportToSkybrush(
    formation: ExportFormation,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `${formation.name.replace(/[^a-zA-Z0-9]/g, '_')}.skyc`;
    const filePath = path.join(this.tempDir, fileName);

    // Generate Skybrush show file
    const skybrushData = {
      version: "1.0",
      meta: {
        title: formation.name,
        description: formation.description,
        author: formation.metadata?.creator || "Unknown",
        duration: formation.duration,
        droneCount: formation.droneCount,
        fps: formation.fps || 24
      },
      environment: {
        coordinateSystem: options.coordinateSystem || "enu",
        origin: { lat: 0, lon: 0, alt: 0 }
      },
      drones: Array.from({ length: formation.droneCount }, (_, i) => ({
        id: i,
        name: `Drone ${i + 1}`,
        type: "generic"
      })),
      show: {
        tracks: this.generateSkybrushTracks(formation)
      }
    };

    await fs.writeFile(filePath, JSON.stringify(skybrushData, null, 2));

    const stats = await fs.stat(filePath);

    return {
      success: true,
      filePath,
      metadata: {
        fileSize: stats.size,
        frameCount: formation.frames.length,
        droneCount: formation.droneCount,
        duration: formation.duration
      }
    };
  }

  /**
   * Generate Skybrush tracks
   */
  private generateSkybrushTracks(formation: ExportFormation): unknown[] {
    const tracks = [];

    for (let droneIndex = 0; droneIndex < formation.droneCount; droneIndex++) {
      const track = {
        droneId: droneIndex,
        keyframes: formation.frames.map(frame => {
          const pos = frame.positions[droneIndex];
          if (!pos) return null;

          return {
            time: frame.time,
            position: {
              x: pos.x,
              y: pos.y,
              z: pos.z
            },
            color: pos.color || "#00FF00",
            brightness: pos.brightness || 1.0
          };
        }).filter(kf => kf !== null)
      };

      tracks.push(track);
    }

    return tracks;
  }

  /**
   * Export to DSS (Drone Show Software) format
   */
  private async exportToDSS(
    formation: ExportFormation,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `${formation.name.replace(/[^a-zA-Z0-9]/g, '_')}.dss`;
    const filePath = path.join(this.tempDir, fileName);

    const dssData = {
      show: {
        name: formation.name,
        description: formation.description,
        duration: formation.duration,
        droneCount: formation.droneCount,
        frameRate: formation.fps || 25
      },
      drones: this.generateDSSTrajectories(formation),
      metadata: formation.metadata || {}
    };

    await fs.writeFile(filePath, JSON.stringify(dssData, null, 2));

    const stats = await fs.stat(filePath);

    return {
      success: true,
      filePath,
      metadata: {
        fileSize: stats.size,
        frameCount: formation.frames.length,
        droneCount: formation.droneCount,
        duration: formation.duration
      }
    };
  }

  /**
   * Generate DSS trajectories
   */
  private generateDSSTrajectories(formation: ExportFormation): unknown[] {
    return Array.from({ length: formation.droneCount }, (_, droneIndex) => ({
      id: droneIndex,
      trajectory: formation.frames.map(frame => {
        const pos = frame.positions[droneIndex];
        return pos ? {
          t: frame.time,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          color: pos.color || "#00FF00"
        } : null;
      }).filter(point => point !== null)
    }));
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(
    formation: ExportFormation,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `${formation.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    const filePath = path.join(this.tempDir, fileName);

    const csvData = this.generateFormationCSV(formation, options);
    await fs.writeFile(filePath, csvData);

    const stats = await fs.stat(filePath);

    return {
      success: true,
      filePath,
      metadata: {
        fileSize: stats.size,
        frameCount: formation.frames.length,
        droneCount: formation.droneCount,
        duration: formation.duration
      }
    };
  }

  /**
   * Generate CSV data
   */
  private generateFormationCSV(formation: ExportFormation, options: ExportOptions): string {
    const headers = ['time', 'drone_id', 'x', 'y', 'z'];
    if (options.includeColors) {
      headers.push('color', 'brightness');
    }

    let csv = headers.join(',') + '\n';

    formation.frames.forEach(frame => {
      frame.positions.forEach((pos, droneIndex) => {
        const row = [
          frame.time.toFixed(3),
          droneIndex.toString(),
          pos.x.toFixed(3),
          pos.y.toFixed(3),
          pos.z.toFixed(3)
        ];

        if (options.includeColors) {
          row.push(pos.color || '#00FF00');
          row.push((pos.brightness || 1.0).toString());
        }

        csv += row.join(',') + '\n';
      });
    });

    return csv;
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(
    formation: ExportFormation,
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `${formation.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = path.join(this.tempDir, fileName);

    const jsonData = {
      formation: {
        ...formation,
        exportOptions: options,
        exportedAt: new Date().toISOString()
      }
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    const stats = await fs.stat(filePath);

    return {
      success: true,
      filePath,
      metadata: {
        fileSize: stats.size,
        frameCount: formation.frames.length,
        droneCount: formation.droneCount,
        duration: formation.duration
      }
    };
  }

  /**
   * Convert Skystage formation to export format
   */
  static convertSkystageFormation(formation: SkystageFormation): ExportFormation {
    // This is a placeholder - in real implementation, you'd parse the actual formation data
    const frames: FormationFrame[] = [];

    // Generate sample frames if no formation data is available
    if (!formation.formationData) {
      // Create a simple circular formation as fallback
      const duration = formation.duration || 30;
      const frameCount = Math.ceil(duration * 24); // 24 FPS
      const droneCount = formation.droneCount || 10;

      for (let f = 0; f < frameCount; f++) {
        const time = (f / frameCount) * duration;
        const positions: DronePosition[] = [];

        for (let d = 0; d < droneCount; d++) {
          const angle = (d / droneCount) * Math.PI * 2;
          const radius = 10 + Math.sin(time * 0.5) * 5;

          positions.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: Math.sin(time * 0.3 + d * 0.1) * 5,
            timestamp: time,
            color: '#00FF88'
          });
        }

        frames.push({ time, positions });
      }
    } else {
      // Parse actual formation data
      // This would need to be implemented based on Skystage's data format
    }

    return {
      id: formation.id,
      name: formation.name,
      description: formation.description,
      frames,
      droneCount: formation.droneCount,
      duration: formation.duration,
      fps: 24,
      metadata: {
        creator: formation.creator,
        created_at: formation.createdAt,
        tags: formation.tags
      }
    };
  }

  /**
   * Utility: Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 1, b: 0 };
  }
}

// Export singleton instance
export const formationExporter = new FormationExporter();
export default FormationExporter;
