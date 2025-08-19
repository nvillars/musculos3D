/**
 * Mock data for testing anatomical 3D viewer
 */

export const mockAnatomicalSystems = [
  {
    id: 'musculoskeletal',
    name: 'Musculoskeletal System',
    color: '#ff6b6b',
    description: 'Bones, muscles, joints, and connective tissues',
    structures: [
      {
        id: 'skeleton',
        name: 'Skeletal System',
        layer: 3,
        structures: [
          { id: 'skull', name: 'Skull', parent: 'skeleton' },
          { id: 'spine', name: 'Spine', parent: 'skeleton' },
          { id: 'ribcage', name: 'Rib Cage', parent: 'skeleton' },
          { id: 'pelvis', name: 'Pelvis', parent: 'skeleton' },
          { id: 'femur', name: 'Femur', parent: 'skeleton' },
          { id: 'tibia', name: 'Tibia', parent: 'skeleton' },
          { id: 'humerus', name: 'Humerus', parent: 'skeleton' },
          { id: 'radius', name: 'Radius', parent: 'skeleton' },
          { id: 'ulna', name: 'Ulna', parent: 'skeleton' }
        ]
      },
      {
        id: 'muscles',
        name: 'Muscular System',
        layer: 2,
        structures: [
          { id: 'biceps_brachii', name: 'Biceps Brachii', parent: 'muscles' },
          { id: 'triceps_brachii', name: 'Triceps Brachii', parent: 'muscles' },
          { id: 'quadriceps', name: 'Quadriceps', parent: 'muscles' },
          { id: 'hamstrings', name: 'Hamstrings', parent: 'muscles' },
          { id: 'gastrocnemius', name: 'Gastrocnemius', parent: 'muscles' },
          { id: 'deltoid', name: 'Deltoid', parent: 'muscles' },
          { id: 'pectoralis_major', name: 'Pectoralis Major', parent: 'muscles' }
        ]
      }
    ]
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular System',
    color: '#e74c3c',
    description: 'Heart, blood vessels, and blood circulation',
    structures: [
      {
        id: 'heart',
        name: 'Heart',
        layer: 2,
        structures: [
          { id: 'left_ventricle', name: 'Left Ventricle', parent: 'heart' },
          { id: 'right_ventricle', name: 'Right Ventricle', parent: 'heart' },
          { id: 'left_atrium', name: 'Left Atrium', parent: 'heart' },
          { id: 'right_atrium', name: 'Right Atrium', parent: 'heart' }
        ]
      },
      {
        id: 'blood_vessels',
        name: 'Blood Vessels',
        layer: 2,
        structures: [
          { id: 'aorta', name: 'Aorta', parent: 'blood_vessels' },
          { id: 'vena_cava', name: 'Vena Cava', parent: 'blood_vessels' },
          { id: 'pulmonary_artery', name: 'Pulmonary Artery', parent: 'blood_vessels' },
          { id: 'pulmonary_vein', name: 'Pulmonary Vein', parent: 'blood_vessels' }
        ]
      }
    ]
  },
  {
    id: 'nervous',
    name: 'Nervous System',
    color: '#f39c12',
    description: 'Brain, spinal cord, and peripheral nerves',
    structures: [
      {
        id: 'central_nervous_system',
        name: 'Central Nervous System',
        layer: 3,
        structures: [
          { id: 'brain', name: 'Brain', parent: 'central_nervous_system' },
          { id: 'spinal_cord', name: 'Spinal Cord', parent: 'central_nervous_system' }
        ]
      },
      {
        id: 'peripheral_nervous_system',
        name: 'Peripheral Nervous System',
        layer: 2,
        structures: [
          { id: 'cranial_nerves', name: 'Cranial Nerves', parent: 'peripheral_nervous_system' },
          { id: 'spinal_nerves', name: 'Spinal Nerves', parent: 'peripheral_nervous_system' }
        ]
      }
    ]
  }
];

export const mockModelData = {
  'basic-skeleton.glb': {
    id: 'basic-skeleton',
    name: 'Basic Skeleton Model',
    system: 'musculoskeletal',
    url: 'test-models/basic-skeleton.glb',
    size: 2048576, // 2MB
    quality: 'medium',
    structures: ['skull', 'spine', 'ribcage', 'pelvis', 'femur', 'tibia', 'humerus'],
    metadata: {
      vertices: 15000,
      faces: 30000,
      textures: ['diffuse', 'normal'],
      animations: []
    }
  },
  'complete-anatomy.glb': {
    id: 'complete-anatomy',
    name: 'Complete Human Anatomy',
    system: 'complete',
    url: 'test-models/complete-anatomy.glb',
    size: 52428800, // 50MB
    quality: 'ultra',
    structures: ['skeleton', 'muscles', 'organs', 'blood_vessels', 'nerves'],
    metadata: {
      vertices: 500000,
      faces: 1000000,
      textures: ['diffuse', 'normal', 'specular', 'roughness'],
      animations: ['breathing', 'heartbeat']
    }
  },
  'heart-model.glb': {
    id: 'heart-model',
    name: 'Detailed Heart Model',
    system: 'cardiovascular',
    url: 'test-models/heart-model.glb',
    size: 8388608, // 8MB
    quality: 'high',
    structures: ['left_ventricle', 'right_ventricle', 'left_atrium', 'right_atrium'],
    metadata: {
      vertices: 75000,
      faces: 150000,
      textures: ['diffuse', 'normal', 'specular'],
      animations: ['heartbeat', 'blood_flow']
    }
  }
};

export const mockAPIResponses = {
  '/api/systems': {
    status: 200,
    data: mockAnatomicalSystems
  },
  '/api/models/basic-skeleton': {
    status: 200,
    data: mockModelData['basic-skeleton.glb']
  },
  '/api/models/complete-anatomy': {
    status: 200,
    data: mockModelData['complete-anatomy.glb']
  },
  '/api/models/heart-model': {
    status: 200,
    data: mockModelData['heart-model.glb']
  },
  '/api/models/nonexistent': {
    status: 404,
    error: 'Model not found'
  },
  '/api/search': {
    status: 200,
    data: {
      query: 'biceps',
      results: [
        {
          id: 'biceps_brachii',
          name: 'Biceps Brachii',
          system: 'musculoskeletal',
          description: 'Two-headed muscle of the upper arm',
          relevance: 0.95
        },
        {
          id: 'biceps_femoris',
          name: 'Biceps Femoris',
          system: 'musculoskeletal',
          description: 'Muscle of the posterior thigh',
          relevance: 0.85
        }
      ]
    }
  }
};

export const mockPerformanceData = {
  desktop: {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 128 * 1024 * 1024, // 128MB
    loadTime: 2500,
    renderTime: 12.5
  },
  mobile: {
    fps: 30,
    frameTime: 33.33,
    memoryUsage: 64 * 1024 * 1024, // 64MB
    loadTime: 5000,
    renderTime: 25.0
  },
  tablet: {
    fps: 45,
    frameTime: 22.22,
    memoryUsage: 96 * 1024 * 1024, // 96MB
    loadTime: 3500,
    renderTime: 18.5
  }
};

export const mockUserInteractions = [
  {
    type: 'click',
    target: 'canvas',
    coordinates: { x: 400, y: 300 },
    expected: 'structure_selection'
  },
  {
    type: 'wheel',
    target: 'canvas',
    delta: -120,
    expected: 'zoom_in'
  },
  {
    type: 'mousemove',
    target: 'canvas',
    coordinates: { x: 450, y: 350 },
    buttons: 1,
    expected: 'camera_rotation'
  },
  {
    type: 'touchstart',
    target: 'canvas',
    touches: [{ x: 200, y: 200 }],
    expected: 'touch_interaction'
  },
  {
    type: 'touchmove',
    target: 'canvas',
    touches: [
      { x: 180, y: 180 },
      { x: 220, y: 220 }
    ],
    expected: 'pinch_zoom'
  }
];

export const mockErrorScenarios = [
  {
    type: 'network_error',
    description: 'Network connection lost during model loading',
    trigger: () => {
      throw new Error('Network request failed');
    },
    expectedRecovery: 'fallback_to_cache'
  },
  {
    type: 'webgl_context_lost',
    description: 'WebGL context lost due to GPU reset',
    trigger: (canvas) => {
      const gl = canvas.getContext('webgl');
      if (gl && gl.getExtension('WEBGL_lose_context')) {
        gl.getExtension('WEBGL_lose_context').loseContext();
      }
    },
    expectedRecovery: 'context_restoration'
  },
  {
    type: 'memory_pressure',
    description: 'Low memory condition on mobile device',
    trigger: () => {
      // Simulate memory pressure
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 120 * 1024 * 1024,
          totalJSHeapSize: 128 * 1024 * 1024,
          jsHeapSizeLimit: 128 * 1024 * 1024
        }
      });
    },
    expectedRecovery: 'quality_reduction'
  },
  {
    type: 'invalid_model',
    description: 'Corrupted or invalid 3D model file',
    trigger: () => {
      return new Blob(['invalid model data'], { type: 'application/octet-stream' });
    },
    expectedRecovery: 'error_message_display'
  }
];

export const mockCacheData = {
  'model_basic-skeleton': {
    key: 'model_basic-skeleton',
    data: mockModelData['basic-skeleton.glb'],
    timestamp: Date.now() - 3600000, // 1 hour ago
    size: 2048576,
    accessCount: 5,
    lastAccessed: Date.now() - 1800000 // 30 minutes ago
  },
  'model_heart-model': {
    key: 'model_heart-model',
    data: mockModelData['heart-model.glb'],
    timestamp: Date.now() - 7200000, // 2 hours ago
    size: 8388608,
    accessCount: 2,
    lastAccessed: Date.now() - 3600000 // 1 hour ago
  },
  'systems_data': {
    key: 'systems_data',
    data: mockAnatomicalSystems,
    timestamp: Date.now() - 1800000, // 30 minutes ago
    size: 4096,
    accessCount: 10,
    lastAccessed: Date.now() - 300000 // 5 minutes ago
  }
};

export default {
  mockAnatomicalSystems,
  mockModelData,
  mockAPIResponses,
  mockPerformanceData,
  mockUserInteractions,
  mockErrorScenarios,
  mockCacheData
};