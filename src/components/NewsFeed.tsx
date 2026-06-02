import React from 'react';
import type { NewsArticle } from '../types';
import { NewsIcon } from './icons/NewsIcon';

interface Props {
  articles: NewsArticle[];
}

const NewsFeed: React.FC<Props> = ({ articles }) => {
  if (!articles || articles.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-200 mb-3">
        <NewsIcon className="h-5 w-5 text-sky-400" />
        Recent News
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700/60 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <p className="text-sm font-medium text-sky-400 hover:text-sky-300 line-clamp-2">
              {article.title}
            </p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{article.snippet}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
