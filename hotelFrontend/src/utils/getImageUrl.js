// Accepts image which may be:
// - a string URL
// - a string path (filename)
// - an object { url, public_id }
// Returns a string URL suitable for <img src>, or null when no image is available
const getServerBase = () => {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return api.replace(/\/api\/?$/, '');
};

export default function getImageUrl(image, fallback = null) {
  if (!image) return fallback;
  let url = '';
  if (typeof image === 'string') url = image;
  else if (typeof image === 'object' && image !== null) url = image.url || '';
  if (!url) return fallback;
  return url.startsWith('http') ? url : `${getServerBase()}/uploads/${url}`;
}
