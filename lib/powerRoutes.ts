import { TrendingUp, Users, BarChart3, Building2, Rocket, type LucideIcon } from 'lucide-react';
import type { PowerPanelId } from '../types/powerApps';

export interface PowerAppRoute {
  id: PowerPanelId;
  slug: string;
  path: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

export const POWER_APPS: PowerAppRoute[] = [
  {
    id: 'nifty',
    slug: 'nifty-prediction',
    path: '/power-apps/nifty-prediction',
    title: 'Nifty Prediction',
    subtitle: 'Strategy Engine',
    description: 'Math-based trend forecast with trading playbooks',
    icon: TrendingUp,
    gradient: 'from-emerald-500/20 to-teal-600/10',
  },
  {
    id: 'fiidii',
    slug: 'fii-dii-tracker',
    path: '/power-apps/fii-dii-tracker',
    title: 'FII / DII Tracker',
    subtitle: 'Institutional Flows',
    description: 'Track foreign & domestic money movement',
    icon: Users,
    gradient: 'from-blue-500/20 to-cyan-600/10',
  },
  {
    id: 'fno',
    slug: 'fno-analyzer',
    path: '/power-apps/fno-analyzer',
    title: 'F&O Analyzer',
    subtitle: 'Volume & Trends',
    description: 'Derivatives scanner with R:R strategies',
    icon: BarChart3,
    gradient: 'from-violet-500/20 to-purple-600/10',
  },
  {
    id: 'equity',
    slug: 'equity-deep-dive',
    path: '/power-apps/equity-deep-dive',
    title: 'Equity Deep-Dive',
    subtitle: 'Long-Term Analysis',
    description: 'Sector-aware value investing insights',
    icon: Building2,
    gradient: 'from-amber-500/20 to-orange-600/10',
  },
  {
    id: 'ipo',
    slug: 'ipo-hub',
    path: '/power-apps/ipo-hub',
    title: 'IPO Hub',
    subtitle: 'Listing Plays',
    description: 'Multi-IPO pros, cons & action plans',
    icon: Rocket,
    gradient: 'from-rose-500/20 to-pink-600/10',
  },
];

export function getPowerAppByPath(path: string) {
  return POWER_APPS.find((a) => a.path === path);
}

export function getPowerAppBySlug(slug: string) {
  return POWER_APPS.find((a) => a.slug === slug);
}