import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  style?: React.CSSProperties;
  className?: string; // Global class name (used for layout/fonts)
  speed?: number;
  wordEffects?: ('none' | 'neon' | 'drip' | 'sparkle' | null)[];
  globalEffect?: 'none' | 'neon' | 'drip' | 'sparkle';
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
    <p style={style} className="inline-block" aria-label={text}>
      {words.map((word, wordIndex) => {
        const localEffect = wordEffects[wordIndex];
        
        // Determine active effect:
        // If localEffect is explicitly defined (including 'none'), use it.
        // Otherwise fall back to globalEffect.
        const activeEffect = (localEffect !== null && localEffect !== undefined) 
          ? localEffect 
          : globalEffect;

        // Construct class name
        const baseClass = className || '';
        const effectClass = (activeEffect && activeEffect !== 'none') ? `effect-${activeEffect}` : '';
        const finalClass = `${baseClass} ${effectClass}`.trim();

        // Determine style
        // If we have an active CSS effect, clear the manual textShadow from style prop to avoid conflicts
        const hasActiveEffect = activeEffect && activeEffect !== 'none';
        const wordStyle = { ...style, textShadow: hasActiveEffect ? undefined : style?.textShadow };

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