export const UID_PATTERN = /^\d{6,12}$/;
export const MOBILE_PATTERN = /^\d{7,15}$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^\d{2}:\d{2}$/;

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isFreeFireUid(v: unknown): v is string {
  return typeof v === 'string' && UID_PATTERN.test(v);
}

export function isMobile(v: unknown): v is string {
  return typeof v === 'string' && MOBILE_PATTERN.test(v);
}

export function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

export function isNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

export function isValidDate(v: unknown): v is string {
  return typeof v === 'string' && DATE_PATTERN.test(v);
}

export function isValidTime(v: unknown): v is string {
  return typeof v === 'string' && TIME_PATTERN.test(v);
}

export function isHttpsUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}
