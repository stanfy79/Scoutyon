import React, { useState } from 'react';
import type { ActivityStep } from '../../types/agent.types';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Globe,
  Tag,
  Search,
  CheckCheck,
} from 'lucide-react';

interface AgentActivityProps {
  steps: ActivityStep[];
  isStreaming: boolean;
}

export const AgentActivity: React.FC<AgentActivityProps> = ({ steps, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0 && !isStreaming) return null;

  const getStepIcon = (step: ActivityStep) => {
    if (step.status === 'running') {
      return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />;
    }
    if (step.status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
    }
    if (step.status === 'success') {
      if (step.type === 'quote') {
        return <Tag className="w-4 h-4 text-emerald-400 shrink-0" />;
      }
      if (step.type === 'tool_call') {
        return <Globe className="w-4 h-4 text-blue-400 shrink-0" />;
      }
      if (step.type === 'done') {
        return <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />;
      }
      return <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    return <Clock className="w-4 h-4 text-gray-500 shrink-0" />;
  };

  const activeStep = steps.find((s) => s.status === 'running') || steps[steps.length - 1];

  return (
    <div className="bg-[#121620] border border-[#202738] rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Activity Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center justify-between px-4 py-3 bg-[#151B27] cursor-pointer hover:bg-[#1A2232] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-200">
                Agent Live Activity
              </span>
              {isStreaming && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse mr-1" />
                  Active
                </span>
              )}
            </div>
            {activeStep && !isExpanded && (
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {activeStep.title}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="text-gray-400 hover:text-gray-200 p-1"
          aria-label="Toggle Activity Log"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Activity Steps Log */}
      {isExpanded && (
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto border-t border-[#1F2636]">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-3 text-xs bg-[#0F131C] p-2.5 rounded-lg border border-[#1A2130]"
            >
              <div className="mt-0.5">{getStepIcon(step)}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-200 leading-snug">
                  {step.title}
                </p>
                {step.details && (
                  <p className="mt-1 text-[11px] text-gray-400 font-mono break-all line-clamp-2">
                    {step.details}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isStreaming && steps.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Initializing autonomous agent & reasoning loop...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
