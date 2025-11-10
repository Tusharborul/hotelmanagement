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

function findInputsMissingIdentifiers(content) {
  // Rough regex to find input/select/textarea tags
  const re = /<(input|select|textarea)\b([^>]*)>/gi;
  const results = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    const tag = m[1];
    const attrs = m[2];
    // Skip lines that look like component props (<> uppercase) - handled by tag regex already
    const hasId = /\bid\s*=\s*["'][^"']+["']/i.test(attrs);
    const hasName = /\bname\s*=\s*["'][^"']+["']/i.test(attrs);
    if (!hasId && !hasName) {
      // capture surrounding text to help locate
      const start = Math.max(0, m.index - 40);
      const snippet = content.substring(start, m.index + m[0].length + 40).split('\n')[0];
      results.push({ tag, attrs: attrs.trim(), index: m.index, snippet: snippet.trim() });
    }
  }
  return results;
}

console.log('Scanning for input/select/textarea without id or name in frontend files...');
const files = walk(path.join(root, 'hotelFrontend'));
let problems = 0;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const findings = findInputsMissingIdentifiers(content);
  if (findings.length === 0) continue;
  for (const fi of findings) {
    problems++;
    console.log(`\nFile: ${path.relative(root, f)}\n  tag: <${fi.tag}> attrs: ${fi.attrs}\n  snippet: ${fi.snippet}`);
  }
}
if (problems === 0) console.log('No input/select/textarea missing id/name found.');
else console.log(`\nFound ${problems} problematic form field(s).`);
