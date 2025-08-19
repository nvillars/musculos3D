const fs = require('fs');
const path = require('path');

// Create a basic glTF 2.0 model (JSON format)
function createBasicGLTF() {
  const gltf = {
    asset: {
      version: "2.0",
      generator: "Musculos3D Basic Model Generator"
    },
    scene: 0,
    scenes: [{
      nodes: [0]
    }],
    nodes: [{
      mesh: 0,
      name: "body_placeholder"
    }],
    meshes: [{
      primitives: [{
        attributes: {
          POSITION: 0,
          NORMAL: 1
        },
        indices: 2,
        material: 0
      }],
      name: "body_mesh"
    }],
    accessors: [
      // Position accessor
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: 24,
        type: "VEC3",
        max: [0.5, 1.0, 0.25],
        min: [-0.5, -1.0, -0.25]
      },
      // Normal accessor
      {
        bufferView: 1,
        componentType: 5126, // FLOAT
        count: 24,
        type: "VEC3"
      },
      // Index accessor
      {
        bufferView: 2,
        componentType: 5123, // UNSIGNED_SHORT
        count: 36,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      // Position buffer view
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: 288,
        byteStride: 12
      },
      // Normal buffer view
      {
        buffer: 0,
        byteOffset: 288,
        byteLength: 288,
        byteStride: 12
      },
      // Index buffer view
      {
        buffer: 0,
        byteOffset: 576,
        byteLength: 72
      }
    ],
    buffers: [{
      uri: "data:application/octet-stream;base64," + createBufferData(),
      byteLength: 648
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: [0.5, 0.5, 0.5, 0.8],
        metallicFactor: 0.0,
        roughnessFactor: 0.8
      },
      name: "body_material"
    }]
  };
  
  return gltf;
}

// Create basic buffer data for a cube
function createBufferData() {
  // Cube vertices (positions)
  const positions = new Float32Array([
    // Front face
    -0.5, -1.0,  0.25,  0.5, -1.0,  0.25,  0.5,  1.0,  0.25, -0.5,  1.0,  0.25,
    // Back face
    -0.5, -1.0, -0.25, -0.5,  1.0, -0.25,  0.5,  1.0, -0.25,  0.5, -1.0, -0.25,
    // Top face
    -0.5,  1.0, -0.25, -0.5,  1.0,  0.25,  0.5,  1.0,  0.25,  0.5,  1.0, -0.25,
    // Bottom face
    -0.5, -1.0, -0.25,  0.5, -1.0, -0.25,  0.5, -1.0,  0.25, -0.5, -1.0,  0.25,
    // Right face
     0.5, -1.0, -0.25,  0.5,  1.0, -0.25,  0.5,  1.0,  0.25,  0.5, -1.0,  0.25,
    // Left face
    -0.5, -1.0, -0.25, -0.5, -1.0,  0.25, -0.5,  1.0,  0.25, -0.5,  1.0, -0.25
  ]);
  
  // Normals (simplified - all faces pointing outward)
  const normals = new Float32Array([
    // Front face
     0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
    // Back face
     0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,
    // Top face
     0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
    // Bottom face
     0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,
    // Right face
     1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
    // Left face
    -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0
  ]);
  
  // Indices
  const indices = new Uint16Array([
    0,  1,  2,    0,  2,  3,   // Front
    4,  5,  6,    4,  6,  7,   // Back
    8,  9,  10,   8,  10, 11,  // Top
    12, 13, 14,   12, 14, 15,  // Bottom
    16, 17, 18,   16, 18, 19,  // Right
    20, 21, 22,   20, 22, 23   // Left
  ]);
  
  // Combine all data
  const buffer = new Uint8Array(positions.buffer);
  const buffer2 = new Uint8Array(normals.buffer);
  const buffer3 = new Uint8Array(indices.buffer);
  
  const combined = new Uint8Array(buffer.length + buffer2.length + buffer3.length);
  combined.set(buffer, 0);
  combined.set(buffer2, buffer.length);
  combined.set(buffer3, buffer.length + buffer2.length);
  
  return Buffer.from(combined).toString('base64');
}

// Create models directory if it doesn't exist
const modelsDir = path.join(__dirname, '../assets/models/fallback');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Generate the glTF file
const gltf = createBasicGLTF();
const modelPath = path.join(modelsDir, 'skeleton.glb');

// For now, save as JSON (glTF) instead of binary (GLB) for simplicity
const jsonPath = path.join(modelsDir, 'skeleton.gltf');
fs.writeFileSync(jsonPath, JSON.stringify(gltf, null, 2));

console.log(`Generated basic model: ${jsonPath}`);
console.log('Note: This is a glTF JSON file. For production, convert to GLB binary format.');
