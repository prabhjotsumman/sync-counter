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
  rotationInterval = 10000 // 10 seconds default
}) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      // Start transition
      setIsTransitioning(true);
      setIsVisible(false);

      // After fade out, change quote and fade back in
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % GURBANI_QUOTES.length);
        setIsVisible(true);
        setIsTransitioning(false);
      }, 300); // Shorter transition time with fixed height
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval]);

  const currentQuote: GurbaniQuoteType = GURBANI_QUOTES[currentQuoteIndex];

  return (
    <div className={`text-center ${className}`}>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isVisible
            ? 'opacity-100 transform translate-y-0 scale-100'
            : 'opacity-0 transform translate-y-1 scale-95'
        }`}
        style={{
          minHeight: showTransliteration && showMeaning ? '140px' :
                    showTransliteration || showMeaning ? '120px' : '80px',
          maxHeight: showTransliteration && showMeaning ? '180px' :
                    showTransliteration || showMeaning ? '150px' : '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0.5rem 0'
        }}
      >
        {/* Gurmukhi Quote */}
        <div className="mb-2 flex-shrink-0 w-full">
          <p
            className="text-lg md:text-xl spiritual-glow text-golden leading-relaxed font-medium"
            style={{
              fontFamily: 'serif',
              direction: 'ltr',
              textAlign: 'center',
              maxWidth: '600px',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              margin: '0 auto',
              lineHeight: '1.6'
            }}
          >
            {currentQuote.gurmukhi}
          </p>
        </div>

        {/* Transliteration */}
        {showTransliteration && (
          <div className="mb-2 flex-shrink-0 w-full">
            <p
              className="text-sm md:text-base text-gray-300 italic font-light"
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: '1.4'
              }}
            >
              {currentQuote.transliteration}
            </p>
          </div>
        )}

        {/* Meaning */}
        {showMeaning && (
          <div className="mb-1 flex-shrink-0 w-full">
            <p
              className="text-xs md:text-sm text-gray-400 leading-relaxed"
              style={{
                maxWidth: '500px',
                margin: '0 auto',
                lineHeight: '1.5'
              }}
            >
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
