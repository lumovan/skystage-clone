/**
 * Export Manager for Drone Show Formations
 * Supports multiple export formats: Blender, DSS, Skybrush, CSV, JSON
 */

import JSZip from 'jszip';

interface DronePosition {
  x: number;
  y: number;
  z: number;
  r?: number;
  g?: number;
  b?: number;
  intensity?: number;
}

interface Formation {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  droneCount: number;
  positions: DronePosition[];
  transition?: any;
  effects?: unknown[];
}

interface Show {
  id: string;
  name: string;
  duration: number;
  formations: Formation[];
  music?: {
    filename: string;
    bpm?: number;
    beats?: Array<{ time: number; intensity: number }>;
  };
  metadata: {
    created: Date;
    modified: Date;
    author: string;
    version: string;
  };
}

export class ExportManager {
  /**
   * Export to Blender Python Script
   */
  static async exportToBlender(show: Show): Promise<Blob> {
    let script = `# SkyStage Drone Show - Blender Import Script
# Generated: ${new Date().toISOString()}
# Show: ${show.name}
# Duration: ${show.duration} seconds

import bpy
import mathutils
from mathutils import Vector

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Create drone collection
collection = bpy.data.collections.new("${show.name}_Drones")
bpy.context.scene.collection.children.link(collection)

# Drone parameters
drone_count = ${show.formations[0]?.droneCount || 100}
show_duration = ${show.duration}
fps = bpy.context.scene.render.fps

# Create drone mesh
def create_drone_mesh():
    mesh = bpy.data.meshes.new("DroneMesh")
    obj = bpy.data.objects.new("DroneTemplate", mesh)

    # Create simple drone geometry (icosphere)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, diameter=0.3)
    bm.to_mesh(mesh)
    bm.free()

    # Add emission material
    mat = bpy.data.materials.new("DroneMaterial")
    mat.use_nodes = True
    emission = mat.node_tree.nodes.new('ShaderNodeEmission')
    emission.inputs[0].default_value = (0, 1, 1, 1)  # Cyan color
    emission.inputs[1].default_value = 5.0  # Strength

    output = mat.node_tree.nodes['Material Output']
    mat.node_tree.links.new(emission.outputs[0], output.inputs[0])

    obj.data.materials.append(mat)
    return obj

# Create drones
drone_template = create_drone_mesh()
drones = []

for i in range(drone_count):
    drone = drone_template.copy()
    drone.data = drone_template.data.copy()
    drone.name = f"Drone_{i:03d}"
    collection.objects.link(drone)
    drones.append(drone)

# Clean up template
bpy.data.objects.remove(drone_template)

# Animate formations
`;

    // Add keyframes for each formation
    show.formations.forEach((formation, formIndex) => {
      const frame = Math.floor((formation.timestamp / show.duration) * 24 * show.duration);

      script += `
# Formation ${formIndex + 1}: ${formation.name}
# Time: ${formation.timestamp}s (Frame ${frame})
`;

      formation.positions.forEach((pos, droneIndex) => {
        script += `
drones[${droneIndex}].location = Vector((${pos.x}, ${pos.z}, ${pos.y}))
drones[${droneIndex}].keyframe_insert(data_path="location", frame=${frame})
`;

        if (pos.r !== undefined && pos.g !== undefined && pos.b !== undefined) {
          script += `
mat = drones[${droneIndex}].data.materials[0]
mat.node_tree.nodes["Emission"].inputs[0].default_value = (${pos.r}, ${pos.g}, ${pos.b}, 1)
mat.node_tree.nodes["Emission"].inputs[0].keyframe_insert(data_path="default_value", frame=${frame})
`;
        }
      });
    });

    script += `
# Set timeline
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = ${Math.floor(show.duration * 24)}

print("Drone show imported successfully!")
print(f"Total drones: {drone_count}")
print(f"Total formations: ${show.formations.length}")
print(f"Duration: ${show.duration} seconds")
`;

    return new Blob([script], { type: 'text/x-python' });
  }

  /**
   * Export to Drone Show Software (DSS) format
   */
  static async exportToDSS(show: Show): Promise<Blob> {
    const dssData = {
      version: '2.0',
      show: {
        name: show.name,
        duration: show.duration,
        drone_count: show.formations[0]?.droneCount || 100,
        formations: show.formations.map(formation => ({
          id: formation.id,
          name: formation.name,
          time: formation.timestamp,
          duration: formation.duration,
          waypoints: formation.positions.map(pos => ({
            x: pos.x,
            y: pos.y,
            z: pos.z,
            color: {
              r: pos.r || 0,
              g: pos.g || 255,
              b: pos.b || 255
            },
            intensity: pos.intensity || 1
          })),
          transition: formation.transition || { type: 'linear' }
        })),
        safety: {
          max_altitude: 120,
          geofence_radius: 100,
          return_to_home_altitude: 30,
          min_battery_percentage: 20
        }
      },
      metadata: {
        created: show.metadata.created,
        author: show.metadata.author,
        software: 'SkyStage Platform',
        version: show.metadata.version
      }
    };

    return new Blob([JSON.stringify(dssData, null, 2)], { type: 'application/json' });
  }

  /**
   * Export to Skybrush format
   */
  static async exportToSkybrush(show: Show): Promise<Blob> {
    const zip = new JSZip();

    // Create project.json
    const project = {
      version: '1.0.0',
      name: show.name,
      duration: show.duration * 1000, // Convert to milliseconds
      swarm: {
        drones: Array.from({ length: show.formations[0]?.droneCount || 100 }, (_, i) => ({
          id: `drone_${i}`,
          home: { lat: 0, lon: 0, amsl: 0 }
        }))
      }
    };

    zip.file('project.json', JSON.stringify(project, null, 2));

    // Create show.json with trajectories
    const trajectories: unknown = {};

    show.formations.forEach((formation, formIndex) => {
      formation.positions.forEach((pos, droneIndex) => {
        const droneId = `drone_${droneIndex}`;

        if (!trajectories[droneId]) {
          trajectories[droneId] = {
            points: [],
            colors: []
          };
        }

        trajectories[droneId].points.push({
          t: formation.timestamp * 1000,
          x: pos.x,
          y: pos.y,
          z: pos.z
        });

        trajectories[droneId].colors.push({
          t: formation.timestamp * 1000,
          r: Math.floor((pos.r || 0) * 255),
          g: Math.floor((pos.g || 1) * 255),
          b: Math.floor((pos.b || 1) * 255)
        });
      });
    });

    const showData = {
      version: '1.0.0',
      trajectories
    };

    zip.file('show.json', JSON.stringify(showData, null, 2));

    // Add validation data
    const validation = {
      max_velocity: 10,
      max_acceleration: 5,
      min_distance: 3,
      geofence: {
        center: [0, 0],
        radius: 100,
        height: 120
      }
    };

    zip.file('validation.json', JSON.stringify(validation, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Export to CSV format
   */
  static async exportToCSV(show: Show): Promise<Blob> {
    let csv = 'Formation,Time,DroneID,X,Y,Z,R,G,B,Intensity\n';

    show.formations.forEach(formation => {
      formation.positions.forEach((pos, droneIndex) => {
        csv += `"${formation.name}",${formation.timestamp},${droneIndex},`;
        csv += `${pos.x.toFixed(3)},${pos.y.toFixed(3)},${pos.z.toFixed(3)},`;
        csv += `${(pos.r || 0).toFixed(2)},${(pos.g || 1).toFixed(2)},${(pos.b || 1).toFixed(2)},`;
        csv += `${(pos.intensity || 1).toFixed(2)}\n`;
      });
    });

    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Export to JSON format
   */
  static async exportToJSON(show: Show): Promise<Blob> {
    const data = {
      version: '1.0.0',
      show: {
        id: show.id,
        name: show.name,
        duration: show.duration,
        formations: show.formations.map(formation => ({
          id: formation.id,
          name: formation.name,
          timestamp: formation.timestamp,
          duration: formation.duration,
          droneCount: formation.droneCount,
          positions: formation.positions,
          transition: formation.transition,
          effects: formation.effects
        })),
        music: show.music,
        metadata: show.metadata
      }
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  /**
   * Export to Custom XML format (for proprietary systems)
   */
  static async exportToXML(show: Show): Promise<Blob> {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<DroneShow version="1.0">
  <Metadata>
    <Name>${show.name}</Name>
    <Duration>${show.duration}</Duration>
    <Created>${show.metadata.created}</Created>
    <Author>${show.metadata.author}</Author>
  </Metadata>
  <Formations>
`;

    show.formations.forEach(formation => {
      xml += `    <Formation id="${formation.id}">
      <Name>${formation.name}</Name>
      <Timestamp>${formation.timestamp}</Timestamp>
      <Duration>${formation.duration}</Duration>
      <Drones count="${formation.droneCount}">
`;

      formation.positions.forEach((pos, index) => {
        xml += `        <Drone id="${index}">
          <Position x="${pos.x}" y="${pos.y}" z="${pos.z}"/>
          <Color r="${pos.r || 0}" g="${pos.g || 1}" b="${pos.b || 1}"/>
          <Intensity>${pos.intensity || 1}</Intensity>
        </Drone>
`;
      });

      xml += `      </Drones>
    </Formation>
`;
    });

    xml += `  </Formations>
</DroneShow>`;

    return new Blob([xml], { type: 'application/xml' });
  }

  /**
   * Export all formats as a ZIP bundle
   */
  static async exportBundle(show: Show): Promise<Blob> {
    const zip = new JSZip();

    // Add all formats to the ZIP
    const blender = await this.exportToBlender(show);
    const dss = await this.exportToDSS(show);
    const skybrush = await this.exportToSkybrush(show);
    const csv = await this.exportToCSV(show);
    const json = await this.exportToJSON(show);
    const xml = await this.exportToXML(show);

    zip.file(`${show.name}_blender.py`, blender);
    zip.file(`${show.name}_dss.json`, dss);
    zip.file(`${show.name}_skybrush.zip`, skybrush);
    zip.file(`${show.name}_data.csv`, csv);
    zip.file(`${show.name}_full.json`, json);
    zip.file(`${show.name}_custom.xml`, xml);

    // Add README
    const readme = `# ${show.name} - Drone Show Export Bundle

## Included Files:
- **${show.name}_blender.py**: Blender Python script for 3D animation
- **${show.name}_dss.json**: Drone Show Software compatible format
- **${show.name}_skybrush.zip**: Skybrush project archive
- **${show.name}_data.csv**: Raw position data in CSV format
- **${show.name}_full.json**: Complete show data in JSON
- **${show.name}_custom.xml**: XML format for custom systems

## Show Information:
- Duration: ${show.duration} seconds
- Formations: ${show.formations.length}
- Drone Count: ${show.formations[0]?.droneCount || 100}
- Created: ${show.metadata.created}
- Author: ${show.metadata.author}

## Usage:
1. **Blender**: Open Blender, switch to Scripting tab, paste and run the .py file
2. **DSS**: Import the .json file directly into Drone Show Software
3. **Skybrush**: Extract and import the .zip archive
4. **CSV**: Use for custom analysis or import into spreadsheet software
5. **JSON**: Use for web applications or custom processing
6. **XML**: Use for proprietary drone control systems

Generated by SkyStage Platform
${new Date().toISOString()}
`;

    zip.file('README.md', readme);

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Download helper
   */
  static download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
