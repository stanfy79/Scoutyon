import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';
import { CopyButton } from '../common/CopyButton';
import { TransferReviewCard } from './TransferReviewCard';
import { parseTransferPrepareRequest } from './transferPrepareRequest';

interface SmartResponseRendererProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * The current agent API persists assistant content as Markdown text. Render the
 * structures that are actually present (not guessed charts or operation data).
 */
export const SmartResponseRenderer: React.FC<SmartResponseRendererProps> = ({ content, isStreaming }) => {
  const transferRequest = parseTransferPrepareRequest(content);
  if (transferRequest) return <TransferReviewCard request={transferRequest} />;

  const components: Components = {
    h1: ({ children }) => <h2 className="response-heading response-heading-primary">{children}</h2>,
    h2: ({ children }) => <h2 className="response-heading">{children}</h2>,
    h3: ({ children }) => <h3 className="response-subheading">{children}</h3>,
    p: ({ children }) => <p className="response-paragraph">{renderTechnicalValues(children)}</p>,
    ul: ({ children }) => <ul className="response-list">{children}</ul>,
    ol: ({ children }) => <ol className="response-list response-ordered-list">{children}</ol>,
    li: ({ children }) => <li>{renderTechnicalValues(children)}</li>,
    blockquote: ({ children }) => <blockquote className="response-quote">{children}</blockquote>,
    hr: () => <hr className="response-divider" />,
    table: ({ children }) => (
      <div className="response-table-scroll" role="region" aria-label="Scrollable response table" tabIndex={0}>
        <table className="response-table">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead>{children}</thead>,
    th: ({ children }) => <th>{renderTechnicalValues(children)}</th>,
    td: ({ children }) => <td>{renderTechnicalValues(children)}</td>,
    a: ({ href, children }) => {
      const safeHref = href && /^https?:\/\//i.test(href) ? href : undefined;
      if (!safeHref) return <span>{children}</span>;
      return <a href={safeHref} target="_blank" rel="noopener noreferrer" className="response-link">
        {children}<ExternalLink aria-hidden="true" className="h-3 w-3" />
      </a>;
    },
    code: ({ children, className }) => {
      const value = String(children).replace(/\n$/, '');
      if (className?.includes('language-')) return <code className="response-code-block">{children}</code>;
      return <span className="response-inline-code"><code title={value}>{value}</code><CopyButton textToCopy={value} label="Copy" className="response-copy" /></span>;
    },
    pre: ({ children }) => <pre className="response-pre">{children}</pre>,
  };

  if (!content.trim()) {
    return isStreaming ? <div className="response-pending" role="status"><span className="response-signal" />Scoutyon is composing a response</div> : null;
  }

  return <div className="smart-response"><ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown></div>;
};

const IDENTIFIER_PATTERN = /\b(?:0x[a-fA-F0-9]{40,}|[A-Za-z0-9_-]{52,})\b/g;

function renderTechnicalValues(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    const parts = children.split(IDENTIFIER_PATTERN);
    const matches = children.match(IDENTIFIER_PATTERN) ?? [];
    if (!matches.length) return children;
    return parts.flatMap((part, index) => index < matches.length
      ? [part, <span className="response-long-id" key={`${matches[index]}-${index}`}><code title={matches[index]}>{matches[index]}</code><CopyButton textToCopy={matches[index]} label="Copy ID" className="response-copy" /></span>]
      : [part]);
  }
  if (Array.isArray(children)) return children.map((child, index) => <React.Fragment key={index}>{renderTechnicalValues(child)}</React.Fragment>);
  return children;
}
