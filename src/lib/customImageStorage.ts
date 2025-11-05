const DIRECT_KEY_PREFIX = 'counterCustomImage:';
const META_KEY = 'counterCustomImage:index';
const LEGACY_KEY = 'counterCustomImages';
const LEGACY_FALLBACK_SUFFIX = '_fallback';
const MAX_STORED_IMAGES = 10;

type MetaEntry = {
  id: string;
  updatedAt: number;
};

const isBrowser = typeof window !== 'undefined';

const safeParseJSON = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('⚠️ Failed to parse JSON from localStorage:', error);
    return null;
  }
};

const readMeta = (): MetaEntry[] => {
  if (!isBrowser) return [];
  const meta = safeParseJSON<MetaEntry[]>(localStorage.getItem(META_KEY));
  if (!meta) return [];
  return meta.filter(entry => entry && typeof entry.id === 'string' && typeof entry.updatedAt === 'number');
};

const writeMeta = (entries: MetaEntry[]) => {
  if (!isBrowser) return;
  try {
    if (entries.length === 0) {
      localStorage.removeItem(META_KEY);
    } else {
      localStorage.setItem(META_KEY, JSON.stringify(entries));
    }
  } catch (error) {
    console.warn('⚠️ Failed to write image metadata to localStorage:', error);
  }
};

const pruneOldEntries = (entries?: MetaEntry[]) => {
  if (!isBrowser) return;
  const meta = entries ? [...entries] : readMeta();
  if (meta.length <= MAX_STORED_IMAGES) return;

  const ordered = [...meta].sort((a, b) => b.updatedAt - a.updatedAt);
  const keep = ordered.slice(0, MAX_STORED_IMAGES);
  const remove = ordered.slice(MAX_STORED_IMAGES);

  remove.forEach(({ id }) => {
    try {
      localStorage.removeItem(`${DIRECT_KEY_PREFIX}${id}`);
    } catch (error) {
      console.warn('⚠️ Failed to remove old stored image from localStorage:', error);
    }
  });

  writeMeta(keep);
};

const migrateLegacyImage = (counterId: string, legacyMap: Record<string, string | undefined> | null): string | null => {
  if (!legacyMap) return null;
  const legacyValue = legacyMap[`${counterId}${LEGACY_FALLBACK_SUFFIX}`] ?? legacyMap[counterId];
  if (!legacyValue) return null;

  saveCustomImage(counterId, legacyValue);

  delete legacyMap[counterId];
  delete legacyMap[`${counterId}${LEGACY_FALLBACK_SUFFIX}`];

  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyMap));
  } catch (error) {
    console.warn('⚠️ Failed to update legacy image storage:', error);
  }

  return legacyValue;
};

export const loadCustomImage = (counterId: string): string | null => {
  if (!isBrowser) return null;

  try {
    const direct = localStorage.getItem(`${DIRECT_KEY_PREFIX}${counterId}`);
    if (direct) {
      return direct;
    }
  } catch (error) {
    console.warn('⚠️ Failed to read custom image from localStorage:', error);
  }

  const legacyMap = safeParseJSON<Record<string, string | undefined>>(localStorage.getItem(LEGACY_KEY));
  return migrateLegacyImage(counterId, legacyMap);
};

export const saveCustomImage = (counterId: string, base64: string): void => {
  if (!isBrowser) return;

  try {
    localStorage.setItem(`${DIRECT_KEY_PREFIX}${counterId}`, base64);
  } catch (error) {
    console.warn('⚠️ Failed to store custom image in localStorage:', error);
  }

  const meta = readMeta().filter(entry => entry.id !== counterId);
  meta.push({ id: counterId, updatedAt: Date.now() });
  writeMeta(meta);
  pruneOldEntries(meta);
};

export const clearCustomImage = (counterId: string): void => {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(`${DIRECT_KEY_PREFIX}${counterId}`);
  } catch (error) {
    console.warn('⚠️ Failed to remove custom image from localStorage:', error);
  }

  const meta = readMeta().filter(entry => entry.id !== counterId);
  writeMeta(meta);

  const legacyMap = safeParseJSON<Record<string, string | undefined>>(localStorage.getItem(LEGACY_KEY));
  if (legacyMap) {
    delete legacyMap[counterId];
    delete legacyMap[`${counterId}${LEGACY_FALLBACK_SUFFIX}`];
    try {
      localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyMap));
    } catch (error) {
      console.warn('⚠️ Failed to update legacy image storage during cleanup:', error);
    }
  }
};
