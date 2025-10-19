import React, { useState, useEffect } from 'react';
import { GURBANI_QUOTES, type GurbaniQuote as GurbaniQuoteType } from '@/data/gurbaniQuotes';

/**
 * Gurbani Quote Component
 * Displays inspirational Sikh scripture quotes in Gurmukhi
 */
interface GurbaniQuoteProps {
  className?: string;
  showTransliteration?: boolean;
  showMeaning?: boolean;
  autoRotate?: boolean;
  rotationInterval?: number;
}

export const GurbaniQuote: React.FC<GurbaniQuoteProps> = ({
  className = '',
  showTransliteration = false,
  showMeaning = true,
  autoRotate = true,
  rotationInterval = 3000 // 10 seconds
}) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setIsVisible(false);

      // Fade out, change quote, fade in
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % GURBANI_QUOTES.length);
        setIsVisible(true);
      }, 500);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval]);

  const currentQuote: GurbaniQuoteType = GURBANI_QUOTES[currentQuoteIndex];

  return (
    <div className={`text-center ${className}`}>
      <div
        className={`transition-all duration-500 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
        }`}
      >
        {/* Gurmukhi Quote */}
        <div className="mb-2">
          <p
            className="text-lg md:text-xl spiritual-glow text-golden leading-relaxed font-medium"
            style={{
              fontFamily: 'serif',
              direction: 'ltr',
              textAlign: 'center'
            }}
          >
            {currentQuote.gurmukhi}
          </p>
        </div>

        {/* Transliteration */}
        {showTransliteration && (
          <div className="mb-2">
            <p className="text-sm md:text-base text-gray-300 italic font-light">
              {currentQuote.transliteration}
            </p>
          </div>
        )}

        {/* Meaning */}
        {showMeaning && (
          <div className="mb-2">
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-2xl mx-auto">
              {currentQuote.meaning}
            </p>
          </div>
        )}

        {/* Quote indicator dots */}
        {/* <div className="flex justify-center space-x-2 mt-3">
          {GURBANI_QUOTES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentQuoteIndex
                  ? 'bg-golden shadow-lg shadow-golden/30'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default GurbaniQuote;
