import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  style?: React.CSSProperties;
  className?: string; // Global class name (used for layout/fonts)
  speed?: number;
  wordEffects?: ('none' | 'neon' | 'drip' | null)[];
  globalEffect?: 'none' | 'neon' | 'drip';
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  style,
  className,
  speed = 40,
  wordEffects = [],
  globalEffect = 'none'
}) => {
  const [visibleCharCount, setVisibleCharCount] = useState(0);

  useEffect(() => {
    setVisibleCharCount(0);
    const interval = setInterval(() => {
      setVisibleCharCount(prev => {
        if (prev < text.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  const words = text.split(' ');
  let charAccumulator = 0;

  return (
    <p style={style} className={`inline-block ${className || ''}`} aria-label={text}>
      {words.map((word, wordIndex) => {
        const localEffect = wordEffects[wordIndex];

        // Determine active effect:
        // If localEffect is explicitly defined (including 'none'), use it.
        // Otherwise fall back to globalEffect.
        const activeEffect = (localEffect !== null && localEffect !== undefined)
          ? localEffect
          : globalEffect;

        // Construct word class name
        const finalClass = (activeEffect && activeEffect !== 'none') ? `effect-${activeEffect}` : '';

        // Determine style
        // If we have an active CSS effect, clear the manual textShadow from style prop to avoid conflicts
        const hasActiveEffect = activeEffect && activeEffect !== 'none';
        const wordStyle = {
          ...style,
          textShadow: hasActiveEffect ? undefined : style?.textShadow,
          '--text-color': style?.color || '#000000',
          '--neon-duration': activeEffect === 'neon' ? `${2 + (wordIndex % 3)}s` : undefined,
          '--neon-delay': activeEffect === 'neon' ? `${(wordIndex % 5) * -0.7}s` : undefined,
        } as React.CSSProperties;

        const wordElement = (
          <span
            key={wordIndex}
            className={finalClass}
            style={wordStyle}
          >
            {word.split('').map((char, charIndex) => {
              const globalCharIndex = charAccumulator + charIndex;
              return (
                <span
                  key={charIndex}
                  style={{ opacity: globalCharIndex < visibleCharCount ? 1 : 0 }}
                >
                  {char}
                </span>
              );
            })}
            {/* Add space unless it's the last word */}
            {wordIndex < words.length - 1 && (
              <span style={{ opacity: (charAccumulator + word.length) < visibleCharCount ? 1 : 0 }}> </span>
            )}
          </span>
        );

        charAccumulator += word.length + 1; // +1 for space
        return wordElement;
      })}
    </p>
  );
};