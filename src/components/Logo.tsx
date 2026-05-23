import React from 'react';

interface LogoProps {
  className?: string;
  size?: number; // width and height in px
}

export default function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        id="aljahfali-gold-emblem"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg transition-transform hover:scale-105 duration-300"
      >
        <defs>
          {/* Metallic Gold Gradients for 3D look resembling the original image */}
          <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF4D0" />
            <stop offset="30%" stopColor="#DFB243" />
            <stop offset="50%" stopColor="#F9D473" />
            <stop offset="70%" stopColor="#B37D14" />
            <stop offset="100%" stopColor="#DFB243" />
          </linearGradient>

          <linearGradient id="goldFill" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#FFEA9F" />
            <stop offset="25%" stopColor="#E6B431" />
            <stop offset="50%" stopColor="#FFF2C6" />
            <stop offset="75%" stopColor="#C3901B" />
            <stop offset="100%" stopColor="#F7CE5B" />
          </linearGradient>

          <linearGradient id="bgSoft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFFDF6" />
          </linearGradient>

          {/* Golden glow drop shadows */}
          <filter id="goldGlow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#DFB243" floodOpacity="0.30" />
          </filter>
        </defs>

        {/* 1. Main outer squarish golden container board with soft light background */}
        <rect
          x="15"
          y="15"
          width="370"
          height="370"
          rx="90"
          fill="url(#bgSoft)"
          stroke="url(#goldBorder)"
          strokeWidth="14"
          filter="url(#goldGlow)"
        />

        {/* Sub-layer decorative inner golden border line */}
        <rect
          x="32"
          y="32"
          width="336"
          height="336"
          rx="78"
          fill="none"
          stroke="url(#goldBorder)"
          strokeWidth="2"
          strokeOpacity="0.6"
        />

        {/* 2. Stylized Golden Smartphone Shape forming the letter "G" / "J" initials icon */}
        {/* Outer mobile frame outline */}
        <path
          d="M175 60 H215 C235 60 245 70 245 90 V245 C245 265 235 275 215 275 H175 C155 275 145 265 145 245 V235 C145 229 149 225 155 225 C161 225 165 229 165 235 V245 C165 251 169 255 175 255 H215 C221 255 225 251 225 245 V90 C225 84 221 80 215 80 H175 C169 80 165 84 165 90 V115 C165 121 161 125 155 125 C149 125 145 121 145 115 V90 C145 70 155 60 175 60 Z"
          fill="url(#goldFill)"
        />

        {/* Dynamic Horizontal Middle Bars that stylize the phone shape */}
        <rect x="251" y="165" width="30" height="20" rx="4" fill="url(#goldFill)" />
        <rect x="210" y="165" width="28" height="20" rx="4" fill="url(#goldFill)" />

        {/* Stylized Giant letter "G" brand connector on the left */}
        <path
          d="M205 120 C145 120 105 150 105 190 C105 230 145 250 185 250 C191 250 195 246 195 240 C195 234 191 230 185 230 C155 230 125 215 125 190 C125 165 155 140 205 140 H208 C214 140 218 136 218 130 C218 124 214 120 208 120 H205 Z"
          fill="url(#goldFill)"
        />

        {/* Golden bar component forming the 'J' hook at the bottom left */}
        <path
          d="M110 218 V232 C110 252 125 268 150 268 H180 C186 268 190 264 190 258 C190 252 186 248 180 248 H150 C138 248 130 240 130 232 V218 C130 212 126 208 120 208 C114 208 110 212 110 218 Z"
          fill="url(#goldFill)"
        />

        {/* Micro elements (e.g., dynamic speaker and button slots representing phone body) */}
        <rect x="185" y="68" width="30" height="5" rx="2" fill="url(#goldFill)" />
        <circle cx="200" cy="265" r="5" fill="url(#goldFill)" />

        {/* 3. Golden Text Typography underneath: "الجحفلي" */}
        <g filter="drop-shadow(0px 3px 2px rgba(179, 125, 20, 0.45))">
          {/* Main "الجحفلي" text layout using hand-crafted calligraphic paths for high compatibility and elegance */}
          {/* Letter 'Alif' + 'Lam' on the right: lya */}
          <path d="M285 305 H295 V255 H285 V305 Z" fill="url(#goldFill)" />
          <path d="M270 305 H280 V255 C280 249 276 245 270 245 C264 245 260 249 260 255 V285 H270 V305 Z" fill="url(#goldFill)" />
          
          {/* Letter 'Jeem' + 'Haa' loop */}
          <path d="M210 305 H260 C266 305 270 301 270 295 L260 280 H210 V290 L200 305 H210 Z" fill="url(#goldFill)" />
          <circle cx="245" cy="318" r="6" fill="url(#goldFill)" /> {/* Dot of Jeem */}

          {/* Letter 'Faa' with dot on top */}
          <path d="M170 305 H200 V290 H185 C180 290 175 285 175 280 C175 275 180 270 185 270 H190 V285 H200 V270 C200 260 190 255 180 255 C170 255 160 265 160 278 C160 295 170 305 170 305 Z" fill="url(#goldFill)" />
          <circle cx="180" cy="245" r="6" fill="url(#goldFill)" /> {/* Dot of Faa */}

          {/* Letter 'Lam' + 'Yaa' flow on the left with dots below */}
          <path d="M100 290 C92 290 85 295 85 305 L100 320 H150 L140 305 H115 V285 C115 275 110 270 100 270 C92 270 88 275 88 285 V290 H100 Z" fill="url(#goldFill)" />
          {/* Two dots of ending 'Yaa' */}
          <circle cx="110" cy="335" r="6" fill="url(#goldFill)" />
          <circle cx="125" cy="335" r="6" fill="url(#goldFill)" />
        </g>
      </svg>
    </div>
  );
}
