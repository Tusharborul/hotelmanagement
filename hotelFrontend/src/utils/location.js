export function normalizeLocation(input = "") {
  const s = String(input).trim();
  if (!s) return "";
  // Collapse internal whitespace and normalize commas spacing
  const normalized = s
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return normalized;
}

export function formatLocation(input = "") {
  const s = String(input).trim();
  if (!s) return "";
  // Title case each segment and word, keep comma separation
  return s
    .split(',')
    .map(seg => seg.trim())
    .map(seg => seg
      .split(/\s+/)
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
      .join(' ')
    )
    .join(', ');
}

export function uniqueLocations(locations = []) {
  const map = new Map();
  locations.forEach(loc => {
    const key = normalizeLocation(loc || "");
    if (key && !map.has(key)) {
      map.set(key, formatLocation(loc));
    }
  });
  return Array.from(map.values());
}
