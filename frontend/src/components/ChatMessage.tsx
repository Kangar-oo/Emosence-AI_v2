import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isEmpty = message.isStreaming && !message.text;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-lg relative ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
        }`}
      >
        {isEmpty ? (
          /* Skeleton dots while waiting for first token */
          <div className="flex gap-1.5 items-center py-1">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {message.text}
            {/* Blinking cursor while streaming */}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        )}

        <div className={`text-[10px] mt-2 opacity-50 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;