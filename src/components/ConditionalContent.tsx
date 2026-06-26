import React, { type ReactNode } from 'react';
import { useConfigMode, type ConfigMode } from './ConfigModeContext';

interface ConditionalContentProps {
  /** Array of mode IDs where this content should be visible */
  modes: ConfigMode[];
  children: ReactNode;
}

/**
 * Wraps content that should only appear for specific configuration modes.
 *
 * The content is always rendered (during server-side static generation as well
 * as on the client) so that any headings inside it produce real anchor targets
 * in the built HTML. Visibility for the active mode is toggled purely via CSS.
 * Rendering server-side keeps the table of contents and cross-page anchor links
 * valid — wrapping in BrowserOnly would strip these headings from the static
 * build and break those anchors.
 *
 * Usage in MDX:
 * ```
 * <ConditionalContent modes={["jc-google", "google-jc"]}>
 *   This content only shows when JumpCloud + Google or Google + JC is selected.
 * </ConditionalContent>
 * ```
 */
export default function ConditionalContent({ modes, children }: ConditionalContentProps) {
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
