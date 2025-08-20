(async ()=>{
  try {
    const HumanMusclesLoader = require('../src/integration/HumanMusclesLoader.js').default || require('../src/integration/HumanMusclesLoader.js');
    const loader = new HumanMusclesLoader({});
    if (!loader) throw new Error('loader missing');
    console.log('HumanMusclesLoader constructor ok');
  } catch (e) {
    console.error(e.stack||e);
    process.exit(2);
  }
})();
