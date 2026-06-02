import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMarketData } from './hooks/useMarketData';
import { useAppStore } from './store/appStore';
import Navigation from './components/Navigation';
import DataStatusBar from './components/Common/DataStatusBar';

const Dashboard      = React.lazy(() => import('./components/Dashboard'));
const Screener       = React.lazy(() => import('./components/Screener'));
const DeepDive       = React.lazy(() => import('./components/DeepDive'));
const FnoIntelligence = React.lazy(() => import('./components/FnoIntelligence'));
const NewsModule     = React.lazy(() => import('./components/NewsModule'));
const AiAdvisor      = React.lazy(() => import('./components/AiAdvisor'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const TabContent: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  return (
    <Suspense fallback={<LoadingFallback />}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'screener'  && <Screener />}
      {activeTab === 'deepdive'  && <DeepDive />}
      {activeTab === 'fno'       && <FnoIntelligence />}
      {activeTab === 'news'      && <NewsModule />}
      {activeTab === 'advisor'   && <AiAdvisor />}
    </Suspense>
  );
};

const AppInner: React.FC = () => {
  useMarketData();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface-900, #070b14)' }}>
      <Navigation />
      <DataStatusBar />
      <main className="flex-1 overflow-auto">
        <TabContent />
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppInner />
  </QueryClientProvider>
);

export default App;
