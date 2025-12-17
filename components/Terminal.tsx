import React, { useEffect, useRef } from 'react';
import { COLORS } from '../constants';

interface TerminalProps {
  messages: string[];
}

export const Terminal: React.FC<TerminalProps> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`h-full flex flex-col ${COLORS.BG_TERM} border ${COLORS.BORDER} p-4 font-mono text-sm md:text-base overflow-hidden`}>
      <div className="overflow-y-auto flex-1 space-y-1">
        {messages.map((msg, idx) => (
          <div key={idx} className="break-words leading-tight">
            <span className="opacity-50 mr-2">{'>'}</span>
            <span dangerouslySetInnerHTML={{ __html: msg }} />
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};