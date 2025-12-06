import React, { useState, useEffect } from 'react';

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end text-sm">
      <span className="font-bold text-gray-700">
        {time.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </span>
      <span className="text-gray-500 font-mono">
        {time.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

export default LiveClock;