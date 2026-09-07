export const CONFIG_KEY = 'etax_helper_config';
export const CONFIG_VERSION = 1;
export const configDefaults = Object.freeze({apiKey: '', newTab: true, tab: '', width: 720});
export class ConfigError extends Error {
  constructor(code) { super(code); this.code = code; }
}
// Flat fields retain compatibility with 1.2.x when rolling back the userscript.
export function migrateConfig(value) {
  if (value == null) return {schemaVersion: CONFIG_VERSION, ...configDefaults};
  if (typeof value !== 'object' || Array.isArray(value)) throw new ConfigError('CONFIG_INVALID');
  const version = value.schemaVersion ?? 0;
  if (!Number.isInteger(version) || version < 0) throw new ConfigError('CONFIG_INVALID');
  if (version > CONFIG_VERSION) throw new ConfigError('CONFIG_VERSION_NEWER');
  const next = {...configDefaults, ...value, schemaVersion: CONFIG_VERSION};
  if (typeof next.apiKey !== 'string' || typeof next.newTab !== 'boolean' || !['', 'account', 'network'].includes(next.tab)) throw new ConfigError('CONFIG_INVALID');
  // Older panel width values may be numeric strings. Never coerce arbitrary fields.
  const width = typeof next.width === 'string' && next.width.trim() ? Number(next.width) : next.width;
  if (typeof width !== 'number' || !Number.isFinite(width)) throw new ConfigError('CONFIG_INVALID');
  next.width = Math.max(480, Math.min(1400, width));
  return next;
}
export function createConfigRepository({getValue, setValue, getLegacy, removeLegacy}) {
  let readable = false;
  function readLatest() {
    const saved = getValue(CONFIG_KEY, null);
    if (saved != null) return {value: migrateConfig(saved), legacy: false};
    const legacy = getLegacy();
    return {value: migrateConfig(JSON.parse(legacy || 'null')), legacy: legacy != null};
  }
  return {
    load() {
      readable = false;
      const result = readLatest();
      // Migrate localStorage only after a successful GM read and full validation.
      if (result.legacy) setValue(CONFIG_KEY, result.value);
      readable = true;
      return result.value;
    },
    save(patch) {
      if (!readable) throw new ConfigError('CONFIG_NOT_LOADED');
      let latest;
      try { latest = readLatest().value; }
      catch (error) { readable = false; throw error; }
      // Re-read before each partial update so a width/tab change retains new API keys.
      const next = migrateConfig({...latest, ...patch, schemaVersion: CONFIG_VERSION});
      setValue(CONFIG_KEY, JSON.parse(JSON.stringify(next)));
      try { removeLegacy(); } catch { /* A successful GM save is still valid. */ }
      return next;
    },
  };
}
