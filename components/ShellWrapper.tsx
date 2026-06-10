'use client';

import { ReactNode, Suspense } from 'react';
import AppShell from './AppShell';
import { useShellNavigation } from '../hooks/useShellNavigation';

function ShellInner({ children }: { children: ReactNode }) {
  const { activeTab, setActiveTab } = useShellNavigation();
  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {children}
    </AppShell>
  );
}

export default function ShellWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}