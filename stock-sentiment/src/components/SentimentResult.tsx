import React from 'react';
import type { SentimentAnalysis } from '../types';
import { Sentiment, Recommendation } from '../types';
import { PositiveIcon } from './icons/PositiveIcon';
import { NegativeIcon } from './icons/NegativeIcon';
import { NeutralIcon } from './icons/NeutralIcon';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { TelegramIcon } from './icons/TelegramIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { ExportIcon } from './icons/ExportIcon';
import NewsFeed from './NewsFeed';
import PriceChart from './PriceChart';
import AspectRadarChart from './AspectRadarChart';
import SentimentChart from './SentimentChart';
import { formatLargeNumber } from '../utils';

interface Props {
  result: SentimentAnalysis;
}

const sentimentStyles: Record<Sentiment, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  [Sentiment.Positive]: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/50', icon: <PositiveIcon className="h-8 w-8 text-green-400" /> },
  [Sentiment.Neutral]: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/50', icon: <NeutralIcon className="h-8 w-8 text-yellow-400" /> },
  [Sentiment.Negative]: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/50', icon: <NegativeIcon className="h-8 w-8 text-red-400" /> },
};

const recommendationStyles: Record<Recommendation, string> = {
  [Recommendation.Buy]: 'bg-green-500 text-green-950 border border-green-400',
  [Recommendation.Sell]: 'bg-red-500 text-red-950 border border-red-400',
  [Recommendation.Hold]: 'bg-amber-500 text-amber-950 border border-amber-400',
};

const formatCurrency = (value: number | null | undefined, symbol: string) => {
  if (value == null) return 'N/A';
  return `${symbol}${value.toLocaleString('en-US')}`;
};

const DataItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-gray-800 p-3 rounded-lg text-center flex flex-col justify-center">
    <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
  </div>
);

const SentimentResult: React.FC<Props> = ({ result }) => {
  const styles = sentimentStyles[result.overallSentiment] ?? sentimentStyles[Sentiment.Neutral];
  const recStyle = recommendationStyles[result.recommendation] ?? recommendationStyles[Recommendation.Hold];
  const scorePercent = ((result.sentimentScore + 1) / 2) * 100;

  const handleExport = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Metric,Value\r\n';
    const rows: Record<string, string | number> = {
      'Company Name': result.companyName,
      'Stock Symbol': result.stockSymbol,
      'Overall Sentiment': result.overallSentiment,
      'Sentiment Score': result.sentimentScore,
      'Recommendation': result.recommendation,
      'Recommendation Summary': `"${result.recommendationSummary.replace(/"/g, '""')}"`,
      'Current Price': `${result.currencySymbol}${result.currentPrice}`,
      '52 Week High': `${result.currencySymbol}${result.fiftyTwoWeekHigh}`,
      '52 Week Low': `${result.currencySymbol}${result.fiftyTwoWeekLow}`,
      'Current Volume': result.currentVolume,
      'Average Volume': result.averageVolume,
      'Summary': `"${result.summary.replace(/"/g, '""')}"`,
    };
    for (const [k, v] of Object.entries(rows)) csv += `"${k}","${v}"\r\n`;
    csv += '\r\nPositive Points\r\nPoint,Reason\r\n';
    result.positivePoints.forEach(p => { csv += `"${p.point.replace(/"/g, '""')}","${p.reason.replace(/"/g, '""')}"\r\n`; });
    csv += '\r\nNegative Points\r\nPoint,Reason\r\n';
    result.negativePoints.forEach(p => { csv += `"${p.point.replace(/"/g, '""')}","${p.reason.replace(/"/g, '""')}"\r\n`; });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    const d = new Date();
    link.setAttribute('download', `${result.stockSymbol}_analysis_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareText = encodeURIComponent(
    `Stock Analysis: ${result.companyName} (${result.stockSymbol})\nSentiment: ${result.overallSentiment} (${result.sentimentScore.toFixed(2)})\nRecommendation: ${result.recommendation}\n${result.summary}`
  );
  const encodedUrl = encodeURIComponent(window.location.href);
  const whatsappLink = `https://wa.me/?text=${shareText}`;
  const telegramLink = `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`;
  const linkedInLink = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodeURIComponent(`AI Stock Analysis: ${result.companyName}`)}&summary=${encodeURIComponent(result.summary)}`;

  return (
    <div className={`bg-gray-800/50 rounded-xl shadow-2xl overflow-hidden border-t-4 ${styles.border}`}>
      {/* Header */}
      <header className={`p-4 sm:p-6 ${styles.bg}`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white">{result.companyName} ({result.stockSymbol})</h2>
            <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1">
              <span className={`px-3 py-1 text-sm font-bold rounded-full ${recStyle}`}>{result.recommendation}</span>
              <p className="text-gray-300 italic">"{result.recommendationSummary}"</p>
            </div>
            <div className={`flex items-center gap-2 mt-3 font-bold text-xl ${styles.text}`}>
              {styles.icon}
              <span>{result.overallSentiment} Sentiment</span>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className={`text-4xl font-extrabold ${styles.text}`}>{result.sentimentScore.toFixed(2)}</div>
            <div className="text-sm text-gray-400">Sentiment Score (-1 to 1)</div>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
          <div
            className={`${styles.text.replace('text-', 'bg-')} h-2.5 rounded-full transition-all duration-700`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </header>

      {/* Body */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
            <DataItem label="Current Price" value={formatCurrency(result.currentPrice, result.currencySymbol)} />
            <DataItem label="52W High" value={formatCurrency(result.fiftyTwoWeekHigh, result.currencySymbol)} />
            <DataItem label="52W Low" value={formatCurrency(result.fiftyTwoWeekLow, result.currencySymbol)} />
            <DataItem label="Volume" value={formatLargeNumber(result.currentVolume)} />
            <DataItem label="Avg. Volume" value={formatLargeNumber(result.averageVolume)} />
          </div>

          <PriceChart
            data={result.historicalData}
            currencySymbol={result.currencySymbol}
            high52={result.fiftyTwoWeekHigh}
            low52={result.fiftyTwoWeekLow}
            indicators={result.technicalIndicators}
          />

          <SentimentChart data={result.historicalData} />

          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Summary</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-green-400 mb-3">
                <PositiveIcon className="h-5 w-5" /> Positive Points
              </h4>
              <ul className="space-y-3 text-gray-300">
                {result.positivePoints.map((item, i) => (
                  <li key={i}>
                    <p className="font-semibold text-gray-200">{item.point}</p>
                    <p className="text-sm text-gray-400 pl-2">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-900/50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-red-400 mb-3">
                <NegativeIcon className="h-5 w-5" /> Negative Points
              </h4>
              <ul className="space-y-3 text-gray-300">
                {result.negativePoints.map((item, i) => (
                  <li key={i}>
                    <p className="font-semibold text-gray-200">{item.point}</p>
                    <p className="text-sm text-gray-400 pl-2">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {result.aspectSentiment && <AspectRadarChart data={result.aspectSentiment} />}

          {result.newsArticles?.length > 0 && <NewsFeed articles={result.newsArticles} />}

          {result.dataSources?.length > 0 && (
            <div className="pt-6 border-t border-gray-700">
              <h3 className="text-xl font-semibold text-gray-200 mb-3">Data Sources</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {result.dataSources.map((src, i) => (
                  <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer"
                    className="block text-sm text-sky-400 hover:underline truncate" title={src.uri}>
                    {src.title || new URL(src.uri).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-700">
            <h3 className="text-xl font-semibold text-gray-200 mb-3">Share & Export</h3>
            <div className="flex items-center gap-4">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"
                className="p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-green-500 hover:text-white transition-colors duration-300">
                <WhatsappIcon className="h-6 w-6" />
              </a>
              <a href={telegramLink} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"
                className="p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-sky-500 hover:text-white transition-colors duration-300">
                <TelegramIcon className="h-6 w-6" />
              </a>
              <a href={linkedInLink} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"
                className="p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-blue-600 hover:text-white transition-colors duration-300">
                <LinkedInIcon className="h-6 w-6" />
              </a>
              <button onClick={handleExport} aria-label="Export as CSV"
                className="p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white transition-colors duration-300">
                <ExportIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentResult;
