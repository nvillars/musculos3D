const { NodeIO } = require('@gltf-transform/core');
const path = require('path');

(async () => {
  try {
    const io = new NodeIO();
    const file = path.resolve('assets/models/human_muscles.glb');
    const doc = io.read(file);
    const nodes = doc.getRoot().listNodes().map(n => ({
      name: n.getName(),
      mesh: n.getMesh() ? n.getMesh().getName() : null
    }));
    console.log(JSON.stringify(nodes.slice(0,50), null, 2));
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
