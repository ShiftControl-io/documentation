import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ConfigMode = 'jc-only' | 'jc-google' | 'google-only' | 'google-jc';

export type DirectoryProvider = 'jumpcloud' | 'google';

export interface DirectoryOption {
  id: DirectoryProvider;
  label: string;
}

export const DIRECTORY_OPTIONS: DirectoryOption[] = [
  { id: 'jumpcloud', label: 'JumpCloud' },
  { id: 'google', label: 'Google Workspace' },
];

/** Derive the config mode from the primary + additional directory selection */
export function deriveMode(primary: DirectoryProvider, additional: DirectoryProvider | 'none'): ConfigMode {
  if (primary === 'jumpcloud' && additional === 'none') return 'jc-only';
  if (primary === 'jumpcloud' && additional === 'google') return 'jc-google';
  if (primary === 'google' && additional === 'none') return 'google-only';
  if (primary === 'google' && additional === 'jumpcloud') return 'google-jc';
  return 'jc-google'; // fallback
}

/** Extract primary + additional from a config mode */
export function parseMode(mode: ConfigMode): { primary: DirectoryProvider; additional: DirectoryProvider | 'none' } {
  switch (mode) {
    case 'jc-only': return { primary: 'jumpcloud', additional: 'none' };
    case 'jc-google': return { primary: 'jumpcloud', additional: 'google' };
    case 'google-only': return { primary: 'google', additional: 'none' };
    case 'google-jc': return { primary: 'google', additional: 'jumpcloud' };
  }
}

const VALID_MODES: ConfigMode[] = ['jc-only', 'jc-google', 'google-only', 'google-jc'];

const COOKIE_NAME = 'sc-docs-mode';
const COOKIE_MAX_AGE = 31536000; // 1 year
const DEFAULT_MODE: ConfigMode = 'jc-google';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function isValidMode(value: string | undefined): value is ConfigMode {
  return VALID_MODES.includes(value as ConfigMode);
}

interface ConfigModeContextValue {
  mode: ConfigMode;
  setMode: (mode: ConfigMode) => void;
}

const ConfigModeContext = createContext<ConfigModeContextValue>({
  mode: DEFAULT_MODE,
  setMode: () => {},
});

/** Map URL param values to internal mode IDs. Accepts both formats for flexibility. */
const URL_PARAM_MAP: Record<string, ConfigMode> = {
  // Primary format (matches internal IDs)
  'jc-only': 'jc-only',
  'jc-google': 'jc-google',
  'google-only': 'google-only',
  'google-jc': 'google-jc',
  // Also accept demo-style params
  'jc_only': 'jc-only',
  'jc_gws': 'jc-google',
  'gws_only': 'google-only',
  'gws_jc': 'google-jc',
};

function getModeFromUrl(): ConfigMode | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const param = params.get('mode');
  if (param && param in URL_PARAM_MAP) {
    return URL_PARAM_MAP[param];
  }
  return undefined;
}

function getModeUrlParam(mode: ConfigMode): string {
  return mode; // use the internal mode ID directly — it's already readable
}

function updateUrlParam(mode: ConfigMode): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('mode', getModeUrlParam(mode));
  window.history.replaceState({}, '', url.toString());
}

export function ConfigModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ConfigMode>(DEFAULT_MODE);

  useEffect(() => {
    // URL param takes precedence over cookie
    const fromUrl = getModeFromUrl();
    if (fromUrl) {
      setModeState(fromUrl);
      setCookie(COOKIE_NAME, fromUrl);
      return;
    }
    const stored = getCookie(COOKIE_NAME);
    if (isValidMode(stored)) {
      setModeState(stored);
      // Add mode to URL so copied links include it
      updateUrlParam(stored);
    } else {
      updateUrlParam(DEFAULT_MODE);
    }
  }, []);

  const setMode = (newMode: ConfigMode) => {
    setModeState(newMode);
    setCookie(COOKIE_NAME, newMode);
    updateUrlParam(newMode);
  };

  return (
    <ConfigModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ConfigModeContext.Provider>
  );
}

export function useConfigMode() {
  return useContext(ConfigModeContext);
}
