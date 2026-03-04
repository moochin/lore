import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function DialogueBox() {
  const active = useGameStore((s) => s.dialogueActive);
  const lines = useGameStore((s) => s.dialogueLines);
  const index = useGameStore((s) => s.dialogueIndex);
  const currentLine = lines[index];

  // Typewriter effect
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!currentLine) return;
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const text = currentLine.text;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [currentLine]);

  if (!active || !currentLine) return null;

  const isLast = index === lines.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 620,
        maxWidth: '92vw',
        backgroundColor: '#1a1a2eee',
        border: '3px solid #8b7355',
        borderRadius: 6,
        padding: '18px 20px 12px',
        zIndex: 1000,
        fontFamily: 'monospace',
        imageRendering: 'pixelated',
        pointerEvents: 'none',
      }}
    >
      {/* Speaker name tab */}
      <div
        style={{
          position: 'absolute',
          top: -13,
          left: 16,
          backgroundColor: '#8b7355',
          color: '#fff',
          padding: '2px 12px',
          fontSize: 11,
          borderRadius: 3,
          fontWeight: 'bold',
        }}
      >
        {currentLine.speaker}
      </div>

      {/* Dialogue text */}
      <p
        style={{
          color: '#ffe0a0',
          fontSize: 14,
          lineHeight: 1.7,
          margin: '4px 0 8px',
          minHeight: 42,
        }}
      >
        {displayedText}
      </p>

      {/* Advance indicator */}
      <div
        style={{
          textAlign: 'right',
          color: '#666',
          fontSize: 10,
        }}
      >
        {isTyping
          ? ''
          : isLast
            ? 'E - Close'
            : 'E - Continue  \u25BC'}
      </div>
    </div>
  );
}
