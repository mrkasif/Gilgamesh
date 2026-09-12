const SETTINGS_STORAGE_KEY = "gilgamesh-settings-v1";
const STORAGE_VERSION = 1;

export interface Settings {
  appearance: "dark" | "light";
  enterToSend: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: "dark",
  enterToSend: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadSettings(): Settings {
  try {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const serialized = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!serialized) return DEFAULT_SETTINGS;
    const raw: unknown = JSON.parse(serialized);
    if (!isRecord(raw) || raw.version !== STORAGE_VERSION) {
      return DEFAULT_SETTINGS;
    }
    return {
      appearance: raw.appearance === "light" ? "light" : "dark",
      enterToSend:
        typeof raw.enterToSend === "boolean" ? raw.enterToSend : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, ...settings }),
    );
  } catch {
    // Ignored.
  }
}