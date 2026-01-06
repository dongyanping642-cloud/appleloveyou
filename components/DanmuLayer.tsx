
import React, { useEffect, useState } from 'react';
import { DANMU_POOL } from '../constants';

const DanmuLayer: React.FC = () => {
  const [danmus, setDanmus] = useState<{ id: number; text: string; top: string; speed: string }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newDanmu = {
        id: Date.now(),
        text: DANMU_POOL[Math.floor(Math.random() * DANMU_POOL.length)],
        top: `${Math.floor(Math.random() * 60 + 15)}%`,
        speed: `${Math.floor(Math.random() * 8 + 12)}s`
      };
      setDanmus(prev => [...prev.slice(-8), newDanmu]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
      {danmus.map(d => (
        <div key={d.id} className="danmu-item" style={{ top: d.top, animationDuration: d.speed }}>{d.text}</div>
      ))}
    </div>
  );
};

export default DanmuLayer;
