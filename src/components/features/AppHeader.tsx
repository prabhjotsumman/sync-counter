import React from 'react';
import CountdownTimer from './counter/CountdownTimer';
import GurbaniQuote from './GurbaniQuote';

export default function AppHeader() {
  return (
    <div className="flex flex-col items-center mb-8 space-y-6">
      <CountdownTimer size={80} />
      <GurbaniQuote
        showTransliteration={false}
        showMeaning={true}
        autoRotate={true}
        rotationInterval={1000 *10} // 1 minute
      />
    </div>
  );
}
