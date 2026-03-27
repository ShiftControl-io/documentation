import React, { useState, useEffect } from 'react';
import { useConfigMode, type ConfigMode } from './ConfigModeContext';
import ThemedImage from '@theme/ThemedImage';

/** Map config mode IDs to screenshot folder names */
const MODE_FOLDERS: Record<ConfigMode, string> = {
  'jc-google': 'jc-google',
  'jc-only': 'jc-only',
  'google-only': 'gws-only',
  'google-jc': 'jc-google', // reuse jc-google screenshots for now
};

const FALLBACK_FOLDER = 'jc-google';

interface ModeScreenshotProps {
  /** Path: "{Section}/{Name}" e.g. "Users/User-management" (no extension, no mode/theme) */
  path: string;
  alt: string;
  width?: string | number;
}

function buildSources(section: string, name: string, folder: string) {
  return {
    light: `/img/ShiftControl/${section}/${folder}/light/${name}.webp`,
    dark: `/img/ShiftControl/${section}/${folder}/dark/${name}.webp`,
  };
}

/**
 * Universal screenshot component for ShiftControl docs.
 * Renders a ThemedImage (SSR-safe) that updates to the correct mode on the client.
 * Does NOT fall back silently — broken images indicate missing screenshots that need capture.
 */
export default function ModeScreenshot({ path, alt, width }: ModeScreenshotProps) {
  const section = path.substring(0, path.indexOf('/'));
  const name = path.substring(path.indexOf('/') + 1);
  const { mode } = useConfigMode();
  const [folder, setFolder] = useState(FALLBACK_FOLDER);

  useEffect(() => {
    setFolder(MODE_FOLDERS[mode] || FALLBACK_FOLDER);
  }, [mode]);

  return (
    <ThemedImage
      sources={buildSources(section, name, folder)}
      alt={alt}
      width={width}
    />
  );
}
