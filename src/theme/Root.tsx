import React from 'react';
import { ConfigModeProvider } from '../components/ConfigModeContext';
import ConfigModeSelector from '../components/ConfigModeSelector';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <ConfigModeProvider>
      {children}
      <ConfigModeSelector />
    </ConfigModeProvider>
  );
}
