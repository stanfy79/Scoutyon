import React from 'react';
import { ExternalLink, Globe, Link2 } from 'lucide-react';

interface ResearchSourcesProps {
  sources: string[];
}

export const ResearchSources: React.FC<ResearchSourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return (
      <div className="bg-[#121620] border border-[#202738] rounded-xl p-4 text-center">
        <Globe className="w-5 h-5 text-gray-500 mx-auto mb-2" />
        <p className="text-xs text-gray-400 font-medium">No external sources fetched yet</p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          URLs cited during research will appear here.
        </p>
      </div>
    );
  }

  const getCleanDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="bg-[#121620] border border-[#202738] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-[#696FFD]" />
        <h4 className="text-xs font-semibold text-gray-200">
          Research sources ({sources.length})
        </h4>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {sources.map((url, idx) => (
          <a
            key={`${url}-${idx}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0E121A] hover:bg-[#161C28] border border-[#1D2433] text-gray-300 hover:text-[#8e93fe] transition-colors group text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#696FFD] shrink-0" />
              <span className="font-medium truncate">{getCleanDomain(url)}</span>
            </div>
            <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-[#696FFD] shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};
