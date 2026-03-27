import React, { type ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useConfigMode, type ConfigMode } from './ConfigModeContext';

interface ConditionalContentProps {
  /** Array of mode IDs where this content should be visible */
  modes: ConfigMode[];
  children: ReactNode;
}

function ConditionalContentInner({ modes, children }: ConditionalContentProps) {
  const { mode } = useConfigMode();
  const isVisible = modes.includes(mode);

  return (
    <div
      className={isVisible ? 'conditional-content' : 'conditional-content conditional-content--hidden'}
      data-modes={modes.join(',')}
    >
      {children}
    </div>
  );
}

/**
 * Wraps content that should only appear for specific configuration modes.
 *
 * Usage in MDX:
 * ```
 * <ConditionalContent modes={["jc-google", "google-jc"]}>
 *   This content only shows when JumpCloud + Google or Google + JC is selected.
 * </ConditionalContent>
 * ```
 */
export default function ConditionalContent({ modes, children }: ConditionalContentProps) {
  return (
    <BrowserOnly fallback={<div />}>
      {() => <ConditionalContentInner modes={modes} children={children} />}
    </BrowserOnly>
  );
}
