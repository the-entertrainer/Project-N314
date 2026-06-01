import React, { useState, useMemo } from 'react';
import FnoEngine, { type IronCondorMetrics } from '@/utils/fnoEngine';
import { LoadingSpinner } from '@/components/Common';

interface IronCondorBuilderProps {
  spotPrice: number;
  currentIV?: number;
  daysToExpiry?: number;
}

export function IronCondorBuilder({
  spotPrice,
  currentIV = 20,
  daysToExpiry = 30,
}: IronCondorBuilderProps) {
  const [atmStrike, setAtmStrike] = useState(spotPrice);
  const [impliedVol, setImpliedVol] = useState(currentIV);
  const [daysToExp, setDaysToExp] = useState(daysToExpiry);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo<IronCondorMetrics | null>(() => {
    try {
      setError(null);
      return FnoEngine.buildIronCondor(
        spotPrice,
        impliedVol / 100,
        daysToExp,
        atmStrike
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid parameters');
      return null;
    }
  }, [spotPrice, impliedVol, daysToExp, atmStrike]);

  const profitLossRatio = metrics
    ? (metrics.maxProfit / metrics.maxLoss).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Parameters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Iron Condor Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Spot Price (₹)
            </label>
            <input
              type="number"
              value={spotPrice}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ATM Strike
            </label>
            <input
              type="number"
              value={atmStrike}
              onChange={(e) => setAtmStrike(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Implied Vol (%)
            </label>
            <input
              type="number"
              value={impliedVol}
              onChange={(e) => setImpliedVol(Number(e.target.value))}
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Days to Expiry
            </label>
            <input
              type="number"
              value={daysToExp}
              onChange={(e) => setDaysToExp(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <>
          {/* Summary Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-semibold mb-1">
                Max Profit
              </p>
              <p className="text-2xl font-bold text-green-900">
                ₹{metrics.maxProfit.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-semibold mb-1">
                Max Loss
              </p>
              <p className="text-2xl font-bold text-red-900">
                ₹{metrics.maxLoss.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-semibold mb-1">
                Profit/Loss Ratio
              </p>
              <p className="text-2xl font-bold text-blue-900">
                1:{profitLossRatio}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700 font-semibold mb-1">
                Profit Width
              </p>
              <p className="text-2xl font-bold text-purple-900">
                ₹{metrics.profitWidth.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Breakevens */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Breakeven Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Lower Breakeven
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{metrics.breakEvenLow.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Put side protection threshold
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Upper Breakeven
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{metrics.breakEvenHigh.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Call side protection threshold
                </p>
              </div>
            </div>
          </div>

          {/* Legs */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Position Legs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  Long Call
                </p>
                <p className="text-2xl font-bold text-green-900 mb-1">
                  {metrics.legs.longCall.strike.toFixed(0)}
                </p>
                <p className="text-sm text-green-700">
                  Premium: ₹{metrics.legs.longCall.premium.toFixed(2)}
                </p>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  Short Call
                </p>
                <p className="text-2xl font-bold text-red-900 mb-1">
                  {metrics.legs.shortCall.strike.toFixed(0)}
                </p>
                <p className="text-sm text-red-700">
                  Premium: ₹{metrics.legs.shortCall.premium.toFixed(2)}
                </p>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  Short Put
                </p>
                <p className="text-2xl font-bold text-red-900 mb-1">
                  {metrics.legs.shortPut.strike.toFixed(0)}
                </p>
                <p className="text-sm text-red-700">
                  Premium: ₹{metrics.legs.shortPut.premium.toFixed(2)}
                </p>
              </div>

              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  Long Put
                </p>
                <p className="text-2xl font-bold text-green-900 mb-1">
                  {metrics.legs.longPut.strike.toFixed(0)}
                </p>
                <p className="text-sm text-green-700">
                  Premium: ₹{metrics.legs.longPut.premium.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Note:</strong> This is a theoretical calculation based
              on Black-Scholes model. Actual option prices may vary. Maximum
              loss can be {metrics.maxLoss.toFixed(0)} rupees per contract.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default IronCondorBuilder;
