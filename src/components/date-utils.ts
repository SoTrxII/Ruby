/**
 * Parse a duration in seconds and outputs a HH:MM:SS string
 * @param secs
 * @private
 */
export function secondsToIso(secs: number): string {
  const d = Math.floor(secs / (3600 * 24));
  const h = Math.floor((secs % (3600 * 24)) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor((secs % 3600) % 60);
  const rawArray = [d, h, m, s];
  let i = -1;
  let done = false;
  while (!done) {
    i++;
    if (rawArray[i] !== 0) done = true;
  }
  const formattedArray = rawArray
    .slice(i)
    .map((arg) => (arg > 0 ? String(arg) : "00"));
  if (formattedArray.length === 0) return "00:00";
  // If only seconds, push a "00" to format
  if (formattedArray.length === 1) formattedArray.unshift("00");
  // Map every single digit number in the array to dual digit to format
  return formattedArray
    .map((e) => (e.length === 1 ? `0${e}` : e))
    .join(":")
    .trim();
}
