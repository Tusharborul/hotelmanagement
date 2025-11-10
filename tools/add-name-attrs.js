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

function addNamesToFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // regex: capture tag start, attrs before value, the value variable, attrs after
  const re = /<(input|select|textarea)([^>]*?)\bvalue\s*=\s*{\s*([A-Za-z0-9_$.]+)\s*}([^>]*)>/gi;
  content = content.replace(re, (match, tag, beforeAttrs, varName, afterAttrs) => {
    const attrs = (beforeAttrs + ' ' + afterAttrs);
    const hasName = /\bname\s*=/.test(attrs);
    const hasId = /\bid\s*=/.test(attrs);
    if (!hasName && !hasId) {
      changed = true;
      // add name attribute before closing of tag
      // prefer simple name: take last part after dot if varName contains dot
      const simple = varName.split('.').pop();
      const insert = ` name=\"${simple}\" `;
      return `<${tag}${beforeAttrs}${insert}value={${varName}}${afterAttrs}>`;
    }
    return match;
  });

  if (changed) fs.writeFileSync(filePath, content, 'utf8');
  return changed;
}

console.log('Auto-adding name attributes where safe (value={var})...');
const files = walk(path.join(root, 'hotelFrontend'));
let total = 0;
for (const f of files) {
  const updated = addNamesToFile(f);
  if (updated) {
    console.log('Updated:', path.relative(root, f));
    total++;
  }
}
console.log(`Done. Updated ${total} file(s).`);
