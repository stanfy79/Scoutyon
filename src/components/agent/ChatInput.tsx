import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '../common/Button';
import { ScoutyonGlyph } from './ScoutyonGlyph';
import type { Budget } from '../../types/budget.types';
import { formatCurrency } from '../../utils/formatCurrency';

interface ChatInputProps {
  onSend: (message: string, budgetId?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  isDisabled?: boolean;
  budgets?: Budget[];
  selectedBudgetId?: string;
  onSelectBudget?: (budgetId: string) => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isStreaming,
  isDisabled = false,
  budgets = [],
  selectedBudgetId,
  onSelectBudget,
  placeholder = 'Ask Scoutyon to research services, compare pricing, or find an API...',
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isStreaming || isDisabled) return;

    onSend(text.trim(), selectedBudgetId);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="scoutyon-composer p-3"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-xs">
        <div className="flex items-center gap-1.5 text-gray-400">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/2">
            <ScoutyonGlyph className="h-4 w-4" active={isStreaming} />
          </div>
          <span>Protocol Budget</span>
        </div>

        <select
          value={selectedBudgetId || ''}
          onChange={(e) => onSelectBudget && onSelectBudget(e.target.value)}
          disabled={isStreaming || isDisabled}
          className="bg-white/3 border border-white/8 text-xs text-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-white/20"
        >
          <option value="">No budget constraint (Open research)</option>
          {budgets
            .filter((b) => b.active)
            .map((b) => (
              <option key={b._id} value={b._id}>
                {b.label} (Remaining:{' '}
                {formatCurrency(Math.max(0, b.totalLimit - b.spent), b.currency)})
              </option>
            ))}
        </select>
      </div>

      {/* Textarea Input */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming || isDisabled}
          className="flex-1 bg-transparent border-0 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-0 max-h-40 py-1.5 px-1 leading-relaxed font-mono tracking-[0.02em]"
        />

        {isStreaming ? (
          <Button
            type="button"
            onClick={onStop}
            variant="danger"
            size="sm"
            className="shrink-0"
            leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
          >
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!text.trim() || isDisabled}
            variant="primary"
            size="sm"
            className="shrink-0"
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        )}
      </div>
    </form>
  );
};
