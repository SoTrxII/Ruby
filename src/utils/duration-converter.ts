export const secondsToDhms = (seconds: number): string => {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor((seconds % 3600) % 60);

  const dDisplay = d > 0 ? d + (d == 1 ? " jour, " : " jours, ") : "";
  const hDisplay = h > 0 ? h + (h == 1 ? " heure, " : " heures, ") : "";
  const mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  const sDisplay = s > 0 ? s + (s == 1 ? " seconde" : " secondes") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};
