// AnatomyManager - Manages anatomical systems and structures
import * as THREE from 'three';

export default class AnatomyManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.systems = new Map();
    this.structures = new Map();
    this.currentSystem = null;
    this.selectedStructure = null;
    
    // Initialize with basic anatomical systems
    this.initializeSystems();
  }

  initializeSystems() {
    // Define basic anatomical systems
    const systemDefinitions = [
      {
        id: 'musculoskeletal',
        name: 'Sistema Musculoesquelético',
        color: '#ff6b6b',
        description: 'Huesos, músculos y articulaciones'
      },
      {
        id: 'cardiovascular',
        name: 'Sistema Cardiovascular',
        color: '#ee5a24',
        description: 'Corazón y vasos sanguíneos'
      },
      {
        id: 'nervous',
        name: 'Sistema Nervioso',
        color: '#feca57',
        description: 'Cerebro, médula espinal y nervios'
      },
      {
        id: 'respiratory',
        name: 'Sistema Respiratorio',
        color: '#48dbfb',
        description: 'Pulmones y vías respiratorias'
      },
      {
        id: 'digestive',
        name: 'Sistema Digestivo',
        color: '#1dd1a1',
        description: 'Órganos digestivos'
      },
      {
        id: 'urinary',
        name: 'Sistema Urinario',
        color: '#5f27cd',
        description: 'Riñones y vías urinarias'
      },
      {
        id: 'lymphatic',
        name: 'Sistema Linfático',
        color: '#ff9ff3',
        description: 'Ganglios linfáticos y vasos'
      }
    ];

    systemDefinitions.forEach(system => {
      this.systems.set(system.id, {
        ...system,
        structures: [],
        visible: true
      });
    });
  }

  async loadInitialScene() {
    try {
      // Create a detailed human body model
      const scene = new THREE.Group();
      
      // Create body parts with different geometries
      const bodyParts = this.createBodyParts();
      
      bodyParts.forEach(part => {
        scene.add(part.mesh);
        this.addStructure(part.id, {
          id: part.id,
          name: part.name,
          system: part.system,
          description: part.description,
          mesh: part.mesh
        });
      });
      
      // Add to renderer scene
      this.renderer.scene.add(scene);
      
      console.log('✅ Scene loaded successfully');
    } catch (error) {
      console.error('❌ Error loading scene:', error);
      throw error;
    }
  }

  createBodyParts() {
    const parts = [];
    
    // Create a more realistic human body structure
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'human_body';
    
    // Torso base (more realistic shape)
    const torsoGeometry = new THREE.CylinderGeometry(0.35, 0.3, 1.4, 12);
    const torsoMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xd4a574,
      transparent: true,
      opacity: 0.9
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, 0.5, 0);
    torso.name = 'torso_base';
    bodyGroup.add(torso);

    // Pectoral muscles (more detailed)
    const pectoralGeometry = new THREE.BoxGeometry(0.25, 0.35, 0.08);
    const pectoralMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xc44569,
      transparent: true,
      opacity: 0.95,
      shininess: 30,
      specular: 0x222222
    });
    
    // Left pectoral with more detail
    const leftPectoral = new THREE.Mesh(pectoralGeometry, pectoralMaterial);
    leftPectoral.position.set(-0.15, 0.6, 0.25);
    leftPectoral.name = 'left_pectoral';
    leftPectoral.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Pectoral Mayor Izquierdo',
      description: 'Músculo pectoral mayor izquierdo - músculo principal del pecho'
    };
    parts.push({
      id: 'left_pectoral',
      name: 'Pectoral Mayor Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo pectoral mayor izquierdo - músculo principal del pecho',
      mesh: leftPectoral
    });
    bodyGroup.add(leftPectoral);

    // Right pectoral
    const rightPectoral = new THREE.Mesh(pectoralGeometry, pectoralMaterial);
    rightPectoral.position.set(0.15, 0.6, 0.25);
    rightPectoral.name = 'right_pectoral';
    rightPectoral.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Pectoral Mayor Derecho',
      description: 'Músculo pectoral mayor derecho - músculo principal del pecho'
    };
    parts.push({
      id: 'right_pectoral',
      name: 'Pectoral Mayor Derecho',
      system: 'musculoskeletal',
      description: 'Músculo pectoral mayor derecho - músculo principal del pecho',
      mesh: rightPectoral
    });
    bodyGroup.add(rightPectoral);

    // Rectus abdominis (six-pack muscles) - more detailed
    const rectusGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.06);
    const rectusMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xc44569,
      transparent: true,
      opacity: 0.95,
      shininess: 30,
      specular: 0x222222
    });
    
    const rectusAbdominis = new THREE.Mesh(rectusGeometry, rectusMaterial);
    rectusAbdominis.position.set(0, 0.1, 0.25);
    rectusAbdominis.name = 'rectus_abdominis';
    rectusAbdominis.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Recto Abdominal',
      description: 'Músculo recto del abdomen - músculos del "six-pack"'
    };
    parts.push({
      id: 'rectus_abdominis',
      name: 'Recto Abdominal',
      system: 'musculoskeletal',
      description: 'Músculo recto del abdomen - músculos del "six-pack"',
      mesh: rectusAbdominis
    });
    bodyGroup.add(rectusAbdominis);

    // External oblique muscles (more realistic)
    const obliqueGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.05);
    const obliqueMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xc44569,
      transparent: true,
      opacity: 0.95,
      shininess: 30,
      specular: 0x222222
    });
    
    // Left external oblique
    const leftOblique = new THREE.Mesh(obliqueGeometry, obliqueMaterial);
    leftOblique.position.set(-0.22, 0.15, 0.2);
    leftOblique.rotation.z = Math.PI / 8;
    leftOblique.name = 'left_external_oblique';
    leftOblique.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Oblicuo Externo Izquierdo',
      description: 'Músculo oblicuo externo del abdomen izquierdo'
    };
    parts.push({
      id: 'left_external_oblique',
      name: 'Oblicuo Externo Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo oblicuo externo del abdomen izquierdo',
      mesh: leftOblique
    });
    bodyGroup.add(leftOblique);

    // Right external oblique
    const rightOblique = new THREE.Mesh(obliqueGeometry, obliqueMaterial);
    rightOblique.position.set(0.22, 0.15, 0.2);
    rightOblique.rotation.z = -Math.PI / 8;
    rightOblique.name = 'right_external_oblique';
    rightOblique.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Oblicuo Externo Derecho',
      description: 'Músculo oblicuo externo del abdomen derecho'
    };
    parts.push({
      id: 'right_external_oblique',
      name: 'Oblicuo Externo Derecho',
      system: 'musculoskeletal',
      description: 'Músculo oblicuo externo del abdomen derecho',
      mesh: rightOblique
    });
    bodyGroup.add(rightOblique);

    // Internal oblique muscles
    const internalObliqueGeometry = new THREE.BoxGeometry(0.1, 0.35, 0.04);
    const internalObliqueMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xb33939,
      transparent: true,
      opacity: 0.9
    });
    
    // Left internal oblique
    const leftInternalOblique = new THREE.Mesh(internalObliqueGeometry, internalObliqueMaterial);
    leftInternalOblique.position.set(-0.18, 0.15, 0.15);
    leftInternalOblique.rotation.z = -Math.PI / 6;
    leftInternalOblique.name = 'left_internal_oblique';
    leftInternalOblique.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Oblicuo Interno Izquierdo',
      description: 'Músculo oblicuo interno del abdomen izquierdo'
    };
    parts.push({
      id: 'left_internal_oblique',
      name: 'Oblicuo Interno Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo oblicuo interno del abdomen izquierdo',
      mesh: leftInternalOblique
    });
    bodyGroup.add(leftInternalOblique);

    // Right internal oblique
    const rightInternalOblique = new THREE.Mesh(internalObliqueGeometry, internalObliqueMaterial);
    rightInternalOblique.position.set(0.18, 0.15, 0.15);
    rightInternalOblique.rotation.z = Math.PI / 6;
    rightInternalOblique.name = 'right_internal_oblique';
    rightInternalOblique.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Oblicuo Interno Derecho',
      description: 'Músculo oblicuo interno del abdomen derecho'
    };
    parts.push({
      id: 'right_internal_oblique',
      name: 'Oblicuo Interno Derecho',
      system: 'musculoskeletal',
      description: 'Músculo oblicuo interno del abdomen derecho',
      mesh: rightInternalOblique
    });
    bodyGroup.add(rightInternalOblique);

    // Transversus abdominis
    const transversusGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.03);
    const transversusMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xa55eea,
      transparent: true,
      opacity: 0.85
    });
    
    const transversusAbdominis = new THREE.Mesh(transversusGeometry, transversusMaterial);
    transversusAbdominis.position.set(0, 0.15, 0.1);
    transversusAbdominis.name = 'transversus_abdominis';
    transversusAbdominis.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Transverso Abdominal',
      description: 'Músculo transverso del abdomen - músculo más profundo'
    };
    parts.push({
      id: 'transversus_abdominis',
      name: 'Transverso Abdominal',
      system: 'musculoskeletal',
      description: 'Músculo transverso del abdomen - músculo más profundo',
      mesh: transversusAbdominis
    });
    bodyGroup.add(transversusAbdominis);

    // Head and neck
    const headGeometry = new THREE.SphereGeometry(0.22, 12, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xd4a574,
      transparent: true,
      opacity: 0.9
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.4, 0);
    head.name = 'head';
    head.userData = {
      type: 'structure',
      system: 'musculoskeletal',
      name: 'Cabeza',
      description: 'Cabeza y cuello'
    };
    parts.push({
      id: 'head',
      name: 'Cabeza',
      system: 'musculoskeletal',
      description: 'Cabeza y cuello',
      mesh: head
    });
    bodyGroup.add(head);

    // Sternocleidomastoid muscles
    const scmGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
    const scmMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xc44569,
      transparent: true,
      opacity: 0.95
    });
    
    // Left SCM
    const leftSCM = new THREE.Mesh(scmGeometry, scmMaterial);
    leftSCM.position.set(-0.08, 1.25, 0.15);
    leftSCM.rotation.z = Math.PI / 6;
    leftSCM.name = 'left_sternocleidomastoid';
    leftSCM.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Esternocleidomastoideo Izquierdo',
      description: 'Músculo esternocleidomastoideo izquierdo del cuello'
    };
    parts.push({
      id: 'left_sternocleidomastoid',
      name: 'Esternocleidomastoideo Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo esternocleidomastoideo izquierdo del cuello',
      mesh: leftSCM
    });
    bodyGroup.add(leftSCM);

    // Right SCM
    const rightSCM = new THREE.Mesh(scmGeometry, scmMaterial);
    rightSCM.position.set(0.08, 1.25, 0.15);
    rightSCM.rotation.z = -Math.PI / 6;
    rightSCM.name = 'right_sternocleidomastoid';
    rightSCM.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Esternocleidomastoideo Derecho',
      description: 'Músculo esternocleidomastoideo derecho del cuello'
    };
    parts.push({
      id: 'right_sternocleidomastoid',
      name: 'Esternocleidomastoideo Derecho',
      system: 'musculoskeletal',
      description: 'Músculo esternocleidomastoideo derecho del cuello',
      mesh: rightSCM
    });
    bodyGroup.add(rightSCM);

    // Orbicularis oculi (eye muscles)
    const eyeGeometry = new THREE.RingGeometry(0.06, 0.1, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xc44569,
      transparent: true,
      opacity: 0.9
    });
    
    // Left orbicularis oculi
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.06, 1.45, 0.18);
    leftEye.name = 'left_orbicularis_oculi';
    leftEye.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Orbicular de los Ojos Izquierdo',
      description: 'Músculo orbicular de los ojos izquierdo'
    };
    parts.push({
      id: 'left_orbicularis_oculi',
      name: 'Orbicular de los Ojos Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo orbicular de los ojos izquierdo',
      mesh: leftEye
    });
    bodyGroup.add(leftEye);

    // Right orbicularis oculi
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.06, 1.45, 0.18);
    rightEye.name = 'right_orbicularis_oculi';
    rightEye.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Orbicular de los Ojos Derecho',
      description: 'Músculo orbicular de los ojos derecho'
    };
    parts.push({
      id: 'right_orbicularis_oculi',
      name: 'Orbicular de los Ojos Derecho',
      system: 'musculoskeletal',
      description: 'Músculo orbicular de los ojos derecho',
      mesh: rightEye
    });
    bodyGroup.add(rightEye);

    // Arms with more detail
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.8, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xd4a574,
      transparent: true,
      opacity: 0.9
    });
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.2, 0);
    leftArm.rotation.z = Math.PI / 8;
    leftArm.name = 'left_arm';
    leftArm.userData = {
      type: 'structure',
      system: 'musculoskeletal',
      name: 'Brazo Izquierdo',
      description: 'Brazo y hombro izquierdo'
    };
    parts.push({
      id: 'left_arm',
      name: 'Brazo Izquierdo',
      system: 'musculoskeletal',
      description: 'Brazo y hombro izquierdo',
      mesh: leftArm
    });
    bodyGroup.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.2, 0);
    rightArm.rotation.z = -Math.PI / 8;
    rightArm.name = 'right_arm';
    rightArm.userData = {
      type: 'structure',
      system: 'musculoskeletal',
      name: 'Brazo Derecho',
      description: 'Brazo y hombro derecho'
    };
    parts.push({
      id: 'right_arm',
      name: 'Brazo Derecho',
      system: 'musculoskeletal',
      description: 'Brazo y hombro derecho',
      mesh: rightArm
    });
    bodyGroup.add(rightArm);

    // Biceps brachii (more detailed)
    const bicepsGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.6, 8);
    const bicepsMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xc44569,
      transparent: true,
      opacity: 0.95,
      shininess: 30,
      specular: 0x222222
    });
    
    // Left biceps
    const leftBiceps = new THREE.Mesh(bicepsGeometry, bicepsMaterial);
    leftBiceps.position.set(-0.5, 0.2, 0.04);
    leftBiceps.rotation.z = Math.PI / 8;
    leftBiceps.name = 'left_biceps';
    leftBiceps.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Bíceps Izquierdo',
      description: 'Músculo bíceps braquial izquierdo'
    };
    parts.push({
      id: 'left_biceps',
      name: 'Bíceps Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo bíceps braquial izquierdo',
      mesh: leftBiceps
    });
    bodyGroup.add(leftBiceps);

    // Right biceps
    const rightBiceps = new THREE.Mesh(bicepsGeometry, bicepsMaterial);
    rightBiceps.position.set(0.5, 0.2, 0.04);
    rightBiceps.rotation.z = -Math.PI / 8;
    rightBiceps.name = 'right_biceps';
    rightBiceps.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Bíceps Derecho',
      description: 'Músculo bíceps braquial derecho'
    };
    parts.push({
      id: 'right_biceps',
      name: 'Bíceps Derecho',
      system: 'musculoskeletal',
      description: 'Músculo bíceps braquial derecho',
      mesh: rightBiceps
    });
    bodyGroup.add(rightBiceps);

    // Triceps brachii
    const tricepsGeometry = new THREE.CylinderGeometry(0.035, 0.025, 0.55, 8);
    const tricepsMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xb33939,
      transparent: true,
      opacity: 0.9
    });
    
    // Left triceps
    const leftTriceps = new THREE.Mesh(tricepsGeometry, tricepsMaterial);
    leftTriceps.position.set(-0.5, 0.2, -0.04);
    leftTriceps.rotation.z = Math.PI / 8;
    leftTriceps.name = 'left_triceps';
    leftTriceps.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Tríceps Izquierdo',
      description: 'Músculo tríceps braquial izquierdo'
    };
    parts.push({
      id: 'left_triceps',
      name: 'Tríceps Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo tríceps braquial izquierdo',
      mesh: leftTriceps
    });
    bodyGroup.add(leftTriceps);

    // Right triceps
    const rightTriceps = new THREE.Mesh(tricepsGeometry, tricepsMaterial);
    rightTriceps.position.set(0.5, 0.2, -0.04);
    rightTriceps.rotation.z = -Math.PI / 8;
    rightTriceps.name = 'right_triceps';
    rightTriceps.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Tríceps Derecho',
      description: 'Músculo tríceps braquial derecho'
    };
    parts.push({
      id: 'right_triceps',
      name: 'Tríceps Derecho',
      system: 'musculoskeletal',
      description: 'Músculo tríceps braquial derecho',
      mesh: rightTriceps
    });
    bodyGroup.add(rightTriceps);

    // Legs with more detail
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.07, 1.2, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xd4a574,
      transparent: true,
      opacity: 0.9
    });
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -1.0, 0);
    leftLeg.name = 'left_leg';
    leftLeg.userData = {
      type: 'structure',
      system: 'musculoskeletal',
      name: 'Pierna Izquierda',
      description: 'Pierna y cadera izquierda'
    };
    parts.push({
      id: 'left_leg',
      name: 'Pierna Izquierda',
      system: 'musculoskeletal',
      description: 'Pierna y cadera izquierda',
      mesh: leftLeg
    });
    bodyGroup.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -1.0, 0);
    rightLeg.name = 'right_leg';
    rightLeg.userData = {
      type: 'structure',
      system: 'musculoskeletal',
      name: 'Pierna Derecha',
      description: 'Pierna y cadera derecha'
    };
    parts.push({
      id: 'right_leg',
      name: 'Pierna Derecha',
      system: 'musculoskeletal',
      description: 'Pierna y cadera derecha',
      mesh: rightLeg
    });
    bodyGroup.add(rightLeg);

    // Quadriceps (more detailed)
    const quadGeometry = new THREE.CylinderGeometry(0.08, 0.05, 0.9, 8);
    const quadMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xc44569,
      transparent: true,
      opacity: 0.95,
      shininess: 30,
      specular: 0x222222
    });
    
    // Left quadriceps
    const leftQuad = new THREE.Mesh(quadGeometry, quadMaterial);
    leftQuad.position.set(-0.15, -1.0, 0.05);
    leftQuad.name = 'left_quadriceps';
    leftQuad.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Cuádriceps Izquierdo',
      description: 'Músculo cuádriceps femoral izquierdo'
    };
    parts.push({
      id: 'left_quadriceps',
      name: 'Cuádriceps Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculo cuádriceps femoral izquierdo',
      mesh: leftQuad
    });
    bodyGroup.add(leftQuad);

    // Right quadriceps
    const rightQuad = new THREE.Mesh(quadGeometry, quadMaterial);
    rightQuad.position.set(0.15, -1.0, 0.05);
    rightQuad.name = 'right_quadriceps';
    rightQuad.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Cuádriceps Derecho',
      description: 'Músculo cuádriceps femoral derecho'
    };
    parts.push({
      id: 'right_quadriceps',
      name: 'Cuádriceps Derecho',
      system: 'musculoskeletal',
      description: 'Músculo cuádriceps femoral derecho',
      mesh: rightQuad
    });
    bodyGroup.add(rightQuad);

    // Hamstrings
    const hamstringGeometry = new THREE.CylinderGeometry(0.07, 0.04, 0.8, 8);
    const hamstringMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xb33939,
      transparent: true,
      opacity: 0.9
    });
    
    // Left hamstrings
    const leftHamstrings = new THREE.Mesh(hamstringGeometry, hamstringMaterial);
    leftHamstrings.position.set(-0.15, -1.0, -0.05);
    leftHamstrings.name = 'left_hamstrings';
    leftHamstrings.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Isquiotibiales Izquierdo',
      description: 'Músculos isquiotibiales izquierdos'
    };
    parts.push({
      id: 'left_hamstrings',
      name: 'Isquiotibiales Izquierdo',
      system: 'musculoskeletal',
      description: 'Músculos isquiotibiales izquierdos',
      mesh: leftHamstrings
    });
    bodyGroup.add(leftHamstrings);

    // Right hamstrings
    const rightHamstrings = new THREE.Mesh(hamstringGeometry, hamstringMaterial);
    rightHamstrings.position.set(0.15, -1.0, -0.05);
    rightHamstrings.name = 'right_hamstrings';
    rightHamstrings.userData = {
      type: 'muscle',
      system: 'musculoskeletal',
      name: 'Isquiotibiales Derecho',
      description: 'Músculos isquiotibiales derechos'
    };
    parts.push({
      id: 'right_hamstrings',
      name: 'Isquiotibiales Derecho',
      system: 'musculoskeletal',
      description: 'Músculos isquiotibiales derechos',
      mesh: rightHamstrings
    });
    bodyGroup.add(rightHamstrings);

    // Add the body group to the scene
    this.renderer.scene.add(bodyGroup);

    return parts;
  }

  addStructure(id, structure) {
    this.structures.set(id, structure);
    
    // Add to system
    const system = this.systems.get(structure.system);
    if (system) {
      system.structures.push(id);
    }
  }

  showOnlySystem(systemId) {
    if (!systemId) {
      // Show all systems
      this.currentSystem = null;
      this.structures.forEach(structure => {
        if (structure.mesh) {
          structure.mesh.visible = true;
        }
      });
      console.log('✅ Showing all systems');
      return;
    }

    const system = this.systems.get(systemId);
    if (!system) return;

    this.currentSystem = systemId;
    
    // Hide all structures
    this.structures.forEach(structure => {
      if (structure.mesh) {
        structure.mesh.visible = false;
      }
    });
    
    // Show only structures from selected system
    system.structures.forEach(structureId => {
      const structure = this.structures.get(structureId);
      if (structure && structure.mesh) {
        structure.mesh.visible = true;
      }
    });
    
    console.log(`✅ Showing system: ${system.name}`);
  }

  search(query) {
    if (!query || query.length < 2) {
      // Show all structures when search is cleared
      this.structures.forEach(structure => {
        if (structure.mesh) {
          structure.mesh.visible = true;
        }
      });
      return [];
    }
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Hide all structures first
    this.structures.forEach(structure => {
      if (structure.mesh) {
        structure.mesh.visible = false;
      }
    });
    
    this.structures.forEach((structure, id) => {
      if (structure.name.toLowerCase().includes(lowerQuery) ||
          structure.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          id,
          name: structure.name,
          system: structure.system,
          description: structure.description
        });
        
        // Show matching structures
        if (structure.mesh) {
          structure.mesh.visible = true;
        }
      }
    });
    
    return results.slice(0, 10); // Limit to 10 results
  }

  selectStructure(structureId) {
    const structure = this.structures.get(structureId);
    if (!structure) return;
    
    this.selectedStructure = structure;
    
    // Highlight the structure
    if (structure.mesh) {
      // Store original material
      if (!structure.originalMaterial) {
        structure.originalMaterial = structure.mesh.material.clone();
      }
      
      // Create highlight material
      const highlightMaterial = structure.mesh.material.clone();
      highlightMaterial.emissive = new THREE.Color(0x444444);
      structure.mesh.material = highlightMaterial;
    }
    
    console.log(`✅ Selected structure: ${structure.name}`);
  }

  clearSelection() {
    if (this.selectedStructure && this.selectedStructure.mesh) {
      // Restore original material
      if (this.selectedStructure.originalMaterial) {
        this.selectedStructure.mesh.material = this.selectedStructure.originalMaterial;
      }
    }
    this.selectedStructure = null;
  }

  highlight(object) {
    // Clear previous selection
    this.clearSelection();
    
    if (!object) return;
    
    // Find structure by mesh object
    let structureId = null;
    this.structures.forEach((structure, id) => {
      if (structure.mesh === object) {
        structureId = id;
      }
    });
    
    // If found, select it
    if (structureId) {
      this.selectStructure(structureId);
    } else {
      // Handle objects that might not be in our structure map
      console.log('Object clicked:', object.name || 'Unknown object');
    }
  }

  getAvailableSystems() {
    return Array.from(this.systems.values());
  }

  getStructuresInSystem(systemId) {
    const system = this.systems.get(systemId);
    if (!system) return [];
    
    return system.structures.map(id => this.structures.get(id)).filter(Boolean);
  }

  getStructureInfo(structureId) {
    return this.structures.get(structureId);
  }

  applyPeelDepth(depth) {
    // Implementation for layer peeling (future feature)
    console.log(`Peeling to depth: ${depth}`);
  }

  hideSelectedMuscle() {
    if (this.selectedStructure && this.selectedStructure.mesh) {
      this.selectedStructure.mesh.visible = false;
      console.log(`✅ Hidden muscle: ${this.selectedStructure.name}`);
      this.selectedStructure = null;
    }
  }

  resetView() {
    // Show all structures
    this.structures.forEach(structure => {
      if (structure.mesh) {
        structure.mesh.visible = true;
      }
    });
    
    // Clear selection
    this.clearSelection();
    
    // Reset system filter
    this.currentSystem = null;
    
    console.log('✅ View reset to show all structures');
  }

  toggleLabels(enabled) {
    // Implementation for showing/hiding labels
    console.log(`Labels ${enabled ? 'enabled' : 'disabled'}`);
    // TODO: Implement label system
  }
}
