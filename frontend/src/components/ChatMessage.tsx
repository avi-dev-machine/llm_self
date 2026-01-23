'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message } from '@/lib/api';

interface ChatMessageProps {
  message: Message;
  userAvatar?: string | null;
  userName?: string;
}

export default function ChatMessage({ message, userAvatar, userName }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? (
          userAvatar ? (
            <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
          ) : (
            userName?.charAt(0) || '👤'
          )
        ) : (
          '🤖'
        )}
      </div>

      <div className="message-content">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' }} {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <pre>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            p: ({ children }) => <p style={{ marginBottom: '12px' }}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{children}</strong>,
            hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />,
          }}
        >
          {message.content}
        </ReactMarkdown>

        {message.has_graph && message.graph_path && (
          <div className="graph-container">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${message.graph_path}`}
              alt="Generated graph"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
