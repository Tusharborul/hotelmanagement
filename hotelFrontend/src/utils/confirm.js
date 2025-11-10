let _askConfirm = null;

export function registerAskConfirm(fn) {
  _askConfirm = fn;
}

export function confirmAsync(message, title = 'Confirm') {
  if (_askConfirm) return _askConfirm({ message, title });
  // No UI confirm provider registered — avoid using the browser-native confirm
  // to ensure consistent non-blocking UX. Resolve as false so destructive
  // actions are not taken unexpectedly. Log a warning for developers.
  // If you intentionally want to allow confirmations without the provider,
  // register a provider or change this fallback behavior.
  // NOTE: this prevents any browser confirm dialogs from appearing.
  console.warn('confirmAsync called but no ConfirmProvider registered. Defaulting to false. Message:', message);
  return Promise.resolve(false);
}

export default { confirmAsync };
