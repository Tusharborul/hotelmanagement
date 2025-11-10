const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = ['.jsx', '.js', '.html', '.htm', '.tsx'];

function walk(dir, files=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(path.join(dir, e.name), files);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (exts.includes(ext)) files.push(path.join(dir, e.name));
    }
  }
  return files;
}

function findLabelsWithFor(content) {
  const re = /<label[^>]*\bfor=["']([^"']+)["'][^>]*>/gi;
  const results = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    results.push({ full: m[0], id: m[1], index: m.index });
  }
  return results;
}

function hasIdInFile(content, id) {
  const escaped = id.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp('id=["\\\']' + escaped + '["\\\']', 'i');
  return re.test(content);
}

console.log('Scanning for <label for=...> in frontend files...');
const files = walk(path.join(root, 'hotelFrontend'));
let problems = 0;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const labels = findLabelsWithFor(content);
  if (labels.length === 0) continue;
  for (const lbl of labels) {
    const ok = hasIdInFile(content, lbl.id);
    if (!ok) {
      problems++;
      console.log(`\nFile: ${path.relative(root, f)}\n  label: ${lbl.full}\n  missing id: ${lbl.id}`);
    }
  }
}
if (problems === 0) console.log('No missing label ids found.');
else console.log(`\nFound ${problems} label(s) with missing id(s).`);
