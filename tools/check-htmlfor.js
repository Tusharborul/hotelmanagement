const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) walk(full, cb);
    else cb(full);
  });
}

const root = path.resolve(__dirname, '../hotelFrontend/src');
const files = [];
walk(root, f => { if (/\.jsx?$/.test(f)) files.push(f); });

const results = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const htmlForRegex = /htmlFor\s*=\s*"([^"]+)"/g;
  let m;
  const ids = new Set();
  const idRegex = /id\s*=\s*"([^"]+)"/g;
  while ((m = idRegex.exec(src)) !== null) ids.add(m[1]);
  const forList = [];
  while ((m = htmlForRegex.exec(src)) !== null) forList.push(m[1]);
  const mismatches = forList.filter(f => !ids.has(f));
  if (mismatches.length) results.push({ file, mismatches, ids: Array.from(ids).slice(0,50) });
}

if (results.length === 0) {
  console.log('No htmlFor mismatches found.');
  process.exit(0);
}

for (const r of results) {
  console.log('File:', r.file);
  console.log('  htmlFor without matching id:', r.mismatches.join(', '));
  console.log('  ids found (sample):', r.ids.join(', '));
}

process.exit(results.length > 0 ? 2 : 0);
