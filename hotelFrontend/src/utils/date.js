const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

export function formatDate(input) {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2,'0');
  const month = MONTHS[d.getMonth()]; // lower-case per requirement example
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTime(input) {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  const hrs = String(d.getHours()).padStart(2,'0');
  const mins = String(d.getMinutes()).padStart(2,'0');
  return `${hrs}:${mins}`;
}

export function formatDateTime(input) {
  const date = formatDate(input);
  const time = formatTime(input);
  if (!date && !time) return '';
  return `${date} ${time}`.trim();
}
