import React, { type ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useConfigMode, CONFIG_MODES, type ConfigMode } from './ConfigModeContext';

interface ModeCalloutProps {
  /** The mode this callout applies to */
  mode: ConfigMode;
  children: ReactNode;
}

function ModeCalloutInner({ mode: targetMode, children }: ModeCalloutProps) {
  const { mode: activeMode } = useConfigMode();
  const isVisible = activeMode === targetMode;
  const modeConfig = CONFIG_MODES.find((m) => m.id === targetMode);

  if (!isVisible) return null;

  return (
    <div className="mode-callout" data-mode={targetMode}>
      <div className="mode-callout__header">
        <span className="mode-callout__icon">⚙️</span>
        <span className="mode-callout__label">{modeConfig?.label ?? targetMode}</span>
      </div>
      <div className="mode-callout__body">{children}</div>
    </div>
  );
}

/**
 * Renders an informational callout box for a specific configuration mode.
 * Only visible when that mode is active.
 *
 * Usage in MDX:
 * ```
 * <ModeCallout mode="jc-google">
 *   When both JumpCloud and Google Workspace are connected, users appear in both directories.
 * </ModeCallout>
 * ```
 */
export default function ModeCallout({ mode, children }: ModeCalloutProps) {
  return (
    <BrowserOnly fallback={<div />}>
      {() => <ModeCalloutInner mode={mode} children={children} />}
    </BrowserOnly>
  );
}
