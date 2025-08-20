const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

(async () => {
  try {
    const csvPath = path.resolve('tmp', 'human_muscles_inspect.csv');
    const outPath = path.resolve('assets', 'models', 'human_muscles_index.json');
    const txt = fs.readFileSync(csvPath, 'utf8');
    const lines = txt.split(/\r?\n/);

    // find SCENES section
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('#,name') && i > 0) {
        // header line
        start = i;
        break;
      }
    }
    if (start === -1) {
      console.error('SCENES header not found');
      process.exit(1);
    }
    const header = parseCSVLine(lines[start]);
    const rows = [];
    for (let i = start + 1; i < lines.length; i++) {
      const l = lines[i];
      if (!l || l.trim().length === 0) break; // end of table
      if (l.trim().startsWith('MESHES')) break;
      const cols = parseCSVLine(l);
      if (cols.length < 2) continue;
      const obj = {};
      for (let j = 0; j < Math.min(header.length, cols.length); j++) {
        obj[header[j]] = cols[j];
      }
      rows.push(obj);
    }

    // convert to desired scaffold
    const scaffold = rows.map(r => ({
      id: r['name'] || null,
      root: r['rootName'] || null,
      bboxMin: r['bboxMin'] || null,
      bboxMax: r['bboxMax'] || null,
      renderVertexCount: Number((r['renderVertexCount'] || '').replace(/[^0-9]/g,'')) || 0,
      uploadVertexCount: Number((r['uploadVertexCount'] || '').replace(/[^0-9]/g,'')) || 0,
      uploadNaiveVertexCount: Number((r['uploadNaiveVertexCount'] || '').replace(/[^0-9]/g,'')) || 0,
      label: null,
      layer: null,
      region: null
    }));

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), source: 'gltf-transform inspect CSV', entries: scaffold }, null, 2), 'utf8');
    console.log('WROTE', outPath, 'entries:', scaffold.length);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
