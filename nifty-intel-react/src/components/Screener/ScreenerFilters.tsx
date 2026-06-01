import React from 'react';
import type { ScreenerFilters } from '@/hooks';

interface ScreenerFiltersProps {
  filters: ScreenerFilters;
  sectors: string[];
  onFilterChange: (key: keyof ScreenerFilters, value: any) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ScreenerFilters({
  filters,
  sectors,
  onFilterChange,
  onRefresh,
  loading,
}: ScreenerFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Ticker or name..."
              value={filters.search}
              onChange={(e) =>
                onFilterChange('search', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Sector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sector
            </label>
            <select
              value={filters.sector}
              onChange={(e) =>
                onFilterChange('sector', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Sectors</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Grade
            </label>
            <select
              value={filters.grade}
              onChange={(e) =>
                onFilterChange('grade', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Grades</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="F">F</option>
            </select>
          </div>

          {/* F&O */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer w-full h-10 px-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.fnoOnly}
                onChange={(e) =>
                  onFilterChange('fnoOnly', e.target.checked)
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                F&O Only
              </span>
            </label>
          </div>

          {/* Institutional */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer w-full h-10 px-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.instOnly}
                onChange={(e) =>
                  onFilterChange('instOnly', e.target.checked)
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                Inst. Only
              </span>
            </label>
          </div>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
            >
              {loading ? 'Refreshing...' : '↻ Refresh Data'}
            </button>
            <button
              onClick={() => {
                onFilterChange('sector', 'all');
                onFilterChange('grade', 'all');
                onFilterChange('fnoOnly', false);
                onFilterChange('instOnly', false);
                onFilterChange('search', '');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScreenerFilters;
