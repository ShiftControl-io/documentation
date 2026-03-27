import React, { useState, useRef, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  DIRECTORY_OPTIONS,
  deriveMode,
  parseMode,
  useConfigMode,
  type DirectoryProvider,
} from './ConfigModeContext';

const PRIMARY_TOOLTIP =
  'Your primary directory is the main source of truth for user identities. Most users should exist here. ShiftControl syncs HRIS data and manages authentication through this directory.';

const ADDITIONAL_TOOLTIP =
  'An additional directory that ShiftControl syncs with alongside your primary. You can manage users and groups in both directories from ShiftControl.';

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show]);

  return (
    <span ref={ref} className="config-mode-tooltip-wrap">
      <span
        className="config-mode-tooltip-trigger"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-label="More info"
      >
        {children}
      </span>
      {show && <span className="config-mode-tooltip">{text}</span>}
    </span>
  );
}

function SelectorBar() {
  const { mode, setMode } = useConfigMode();
  const { primary, additional } = parseMode(mode);

  const handlePrimaryChange = (newPrimary: DirectoryProvider) => {
    // If additional is same as new primary, reset additional to 'none'
    const newAdditional = additional === newPrimary ? 'none' : additional;
    setMode(deriveMode(newPrimary, newAdditional));
  };

  const handleAdditionalChange = (newAdditional: DirectoryProvider | 'none') => {
    setMode(deriveMode(primary, newAdditional));
  };

  // Get the "other" directory for the additional dropdown
  const otherDirectory = DIRECTORY_OPTIONS.find((d) => d.id !== primary);

  return (
    <div className="config-mode-bar" role="navigation" aria-label="Directory configuration selector">
      <div className="config-mode-bar__inner">
        <div className="config-mode-field">
          <span className="config-mode-field__label">
            Primary directory
            <Tooltip text={PRIMARY_TOOLTIP}>
              <span className="config-mode-info-icon">?</span>
            </Tooltip>
          </span>
          <select
            className="config-mode-select"
            value={primary}
            onChange={(e) => handlePrimaryChange(e.target.value as DirectoryProvider)}
          >
            {DIRECTORY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="config-mode-field">
          <span className="config-mode-field__label">
            Additional directory
            <Tooltip text={ADDITIONAL_TOOLTIP}>
              <span className="config-mode-info-icon">?</span>
            </Tooltip>
          </span>
          <select
            className="config-mode-select"
            value={additional}
            onChange={(e) => handleAdditionalChange(e.target.value as DirectoryProvider | 'none')}
          >
            <option value="none">None</option>
            {otherDirectory && (
              <option value={otherDirectory.id}>{otherDirectory.label}</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function ConfigModeSelector() {
  return (
    <BrowserOnly fallback={<div className="config-mode-bar config-mode-bar--placeholder" />}>
      {() => <SelectorBar />}
    </BrowserOnly>
  );
}
