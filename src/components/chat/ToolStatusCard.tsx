import React from 'react';
import { Check } from 'lucide-react';

export interface ToolStatus {
  tool: string;
  status: 'searching' | 'processing' | 'done';
  timestamp: number;
}

interface ToolStatusCardProps {
  toolStatus: ToolStatus;
}

const getToolLabel = (tool: string, status: string): string => {
  const labels = {
    search_artist_data: {
      searching: "Searching your content data...",
      processing: "Analyzing your content patterns...",
      done: "Analyzed content patterns"
    },
    search_videos: {
      searching: "Searching viral database...",
      processing: "Ranking top results...",
      done: "Found viral matches"
    }
  };

  return labels[tool as keyof typeof labels]?.[status as keyof typeof labels.search_artist_data] || 
         `${status.charAt(0).toUpperCase() + status.slice(1)} ${tool.replace(/_/g, ' ')}...`;
};

const ToolStatusCard: React.FC<ToolStatusCardProps> = ({ toolStatus }) => {
  const { tool, status } = toolStatus;
  const label = getToolLabel(tool, status);
  const isDone = status === 'done';

  return (
    <div className="border border-white/[0.08] rounded-lg bg-white/[0.03] px-3 py-2 my-2 max-w-[320px] flex items-center gap-2.5 transition-opacity duration-200">
      <div className="shrink-0 w-[14px] h-[14px] flex items-center justify-center">
        {isDone ? (
          <Check className="w-[14px] h-[14px] text-emerald-400" />
        ) : (
          <div 
            className="w-[14px] h-[14px] border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"
            style={{ animationDuration: '0.8s' }}
          />
        )}
      </div>
      <span className="text-sm text-white/60">{label}</span>
    </div>
  );
};

export default ToolStatusCard;