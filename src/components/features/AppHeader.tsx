import React from 'react';
import CountdownTimer from './counter/CountdownTimer';
import GurbaniQuote from './GurbaniQuote';

export default function AppHeader() {
  return (
    <div className="flex flex-col items-center mb-2 space-y-2">
      <CountdownTimer size={80} />
      <GurbaniQuote
        showTransliteration={false}
        showMeaning={true}
        autoRotate={true}
        rotationInterval={10000} // 10 seconds
      />
    </div>
  );
}
