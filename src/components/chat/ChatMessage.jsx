import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
        isUser 
          ? 'bg-slate-800' 
          : 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-2xl px-5 py-3 ${
          isUser 
            ? 'bg-slate-800 text-white' 
            : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed text-sm">{children}</p>,
                  ul: ({ children }) => <ul className="my-2 ml-4 list-disc text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal text-sm">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-lg font-bold my-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-1">{children}</h3>,
                  code: ({ children }) => (
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 text-teal-700 text-xs font-mono">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}