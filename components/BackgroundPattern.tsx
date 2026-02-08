"use client";

/**
 * components/BackgroundPattern.tsx
 * 
 * Purpose:
 * - Provides a customizable vector background pattern with mountain design
 * - Can change color via props
 * - Mountain/nature themed for NextStep AI
 */

type BackgroundPatternProps = {
  color?: string; // Hex color for the pattern (default: #059669)
  opacity?: number; // Opacity 0-1 (default: 0.1)
  className?: string;
};

export default function BackgroundPattern({ 
  color = "#059669", 
  opacity = 0.1,
  className = "" 
}: BackgroundPatternProps) {
  return (
    <div 
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: opacity
        }}
      >
        {/* Mountain range - Background layer (farthest) */}
        <path
          d="M0,800 L0,600 Q100,550 200,600 T400,550 T600,500 T800,550 T1000,450 T1200,500 L1200,800 Z"
          fill={color}
          opacity="0.4"
        />
        
        {/* Mountain range - Middle layer */}
        <path
          d="M0,800 L0,500 Q150,400 300,450 T600,350 T900,400 T1200,350 L1200,800 Z"
          fill={color}
          opacity="0.6"
        />
        
        {/* Mountain range - Foreground layer (closest) */}
        <path
          d="M0,800 L0,450 Q100,350 250,400 T500,300 T750,350 T1000,250 T1200,300 L1200,800 Z"
          fill={color}
          opacity="0.8"
        />
        
        {/* Individual mountain peaks for detail */}
        {/* Left peak */}
        <path
          d="M150,600 L200,450 L250,600 Z"
          fill={color}
          opacity="0.5"
        />
        
        {/* Center-left peak */}
        <path
          d="M400,550 L450,400 L500,550 Z"
          fill={color}
          opacity="0.6"
        />
        
        {/* Center peak */}
        <path
          d="M600,500 L650,350 L700,500 Z"
          fill={color}
          opacity="0.7"
        />
        
        {/* Center-right peak */}
        <path
          d="M800,550 L850,400 L900,550 Z"
          fill={color}
          opacity="0.6"
        />
        
        {/* Right peak */}
        <path
          d="M1000,450 L1050,300 L1100,450 Z"
          fill={color}
          opacity="0.7"
        />
        
        {/* Additional smaller peaks for texture */}
        <path
          d="M300,600 L320,550 L340,600 Z"
          fill={color}
          opacity="0.4"
        />
        <path
          d="M700,550 L720,500 L740,550 Z"
          fill={color}
          opacity="0.4"
        />
        <path
          d="M950,500 L970,450 L990,500 Z"
          fill={color}
          opacity="0.4"
        />
        
        {/* Snow caps on peaks (lighter color) */}
        <path
          d="M200,450 L220,430 L240,450 L250,440 L230,420 L200,450 Z"
          fill="white"
          opacity="0.3"
        />
        <path
          d="M650,350 L670,330 L690,350 L700,340 L680,320 L650,350 Z"
          fill="white"
          opacity="0.3"
        />
        <path
          d="M1050,300 L1070,280 L1090,300 L1100,290 L1080,270 L1050,300 Z"
          fill="white"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
