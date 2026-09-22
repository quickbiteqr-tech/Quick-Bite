'use client';
import { useEffect, useRef } from 'react';

export default function HeroBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!bgRef.current) return;
      const { left, top } = bgRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      // Updates CSS variables directly - bypassing React state for maximum performance
      bgRef.current.style.setProperty('--mouse-x', `${x}px`);
      bgRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={bgRef}
      className="absolute inset-0 z-0 overflow-hidden bg-[#fafafa] pointer-events-none"
    >
      {/* 1. Bulletproof SVG Grid Pattern */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm1 1h38v38H1V1z\' fill=\'%23000000\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          backgroundSize: '40px 40px' 
        }}
      ></div>
      
      {/* 2. Edge Vignette (forces the user's eye to the center Bento Grid) */}
      <div 
        className="absolute inset-0" 
        style={{ background: 'radial-gradient(circle at center, transparent 40%, #fafafa 100%)'}}
      />

      {/* 3. Dynamic Flashlight Effect */}
      <div 
        className="absolute inset-0 opacity-0 transition-opacity duration-700 lg:opacity-100 pointer-events-none"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(109, 190, 69, 0.08), transparent 40%)'
        }}
      />
    </div>
  );
}