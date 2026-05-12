import { converter, formatHex } from 'culori';

export function areArraysEqual<T>(previous: T[], next: T[]): boolean {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  for (let index = 0; index < previous.length; index += 1)
    if (!Object.is(previous[index], next[index])) return false;
  return true;
}

const toRgb = converter('rgb');

export function oklchToHex(color: string) {
  const rgb = toRgb(color);

  if (!rgb) return null;

  return formatHex(rgb);
}
