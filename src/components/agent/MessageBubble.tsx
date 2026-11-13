import React from 'react';
import type { ChatMessage } from '../../types/agent.types';
import { formatDate } from '../../utils/formatDate';
import { SmartResponseRenderer } from './SmartResponseRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`scoutyon-message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`scoutyon-message-shell ${isUser ? 'user' : 'assistant'}`}>
        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] response-meta">
          <span>{isUser ? 'Command' : 'Scoutyon Core'}</span>
          <span>{formatDate(message.timestamp)}</span>
        </div>

        <div className="scoutyon-message-content">
          {isUser ? (
            <div className="flex items-start justify-between gap-3">
              <span className="scoutyon-command-pill">Intent</span>
              <p className="whitespace-pre-wrap text-sm text-gray-100 leading-relaxed">{message.content}</p>
            </div>
          ) : (
            <SmartResponseRenderer content={message.content} isStreaming={isStreaming} />
          )}
        </div>
      </div>
    </div>
  );
};
