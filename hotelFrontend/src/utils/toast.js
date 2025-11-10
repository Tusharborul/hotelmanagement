let _addToast = null;

export function registerAddToast(fn) {
  _addToast = fn;
}

export function showToast(message, type = 'info', duration = 4000) {
  if (typeof message !== 'string') message = String(message || '');
  if (_addToast) {
    _addToast({ id: Date.now() + Math.random(), message, type, duration });
  } else {
    // fallback to console if provider not ready
    console[type === 'error' ? 'error' : 'log']('[toast]', type, message);
  }
}

export default { showToast };
