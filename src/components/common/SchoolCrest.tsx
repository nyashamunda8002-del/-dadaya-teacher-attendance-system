import React from 'react';

interface SchoolCrestProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const SchoolCrest: React.FC<SchoolCrestProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const sizeMap = {
    xs: 'w-8 h-9 sm:w-9 sm:h-10',
    sm: 'w-11 h-12 sm:w-12 sm:h-14',
    md: 'w-18 h-20 sm:w-22 sm:h-24',
    lg: 'w-28 h-32 sm:w-32 sm:h-36',
    xl: 'w-40 h-44 sm:w-44 sm:h-48',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
        {/* Authentic Dadaya High School Official Crest SVG with Complete Typography */}
        <svg
          viewBox="0 0 200 232"
          className="w-full h-full drop-shadow-md overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Motto Arch */}
            <path id="top-motto-path" d="M 48,46 Q 100,28 152,46" fill="none" />
            {/* Lower Left HIGH Path */}
            <path id="crest-high-path" d="M 32,196 Q 64,218 92,220" fill="none" />
            {/* Lower Right SCHOOL Path with ample length so SCHOOL is never truncated */}
            <path id="crest-school-path" d="M 108,220 Q 138,218 172,194" fill="none" />

            <linearGradient id="shieldGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803D" />
              <stop offset="50%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532D" />
            </linearGradient>

            <linearGradient id="crestGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* 1. OUTER GREEN SHIELD */}
          <path
            d="M 30,26 C 65,12 85,30 100,30 C 115,30 135,12 170,26 C 174,75 168,128 100,185 C 32,128 26,75 30,26 Z"
            fill="url(#shieldGreenGradient)"
            stroke="#0F3D24"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* 2. INNER WHITE SHIELD CONTOUR */}
          <path
            d="M 36,32 C 68,20 86,36 100,36 C 114,36 132,20 164,32 C 167,76 161,123 100,176 C 39,123 33,76 36,32 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* 3. GOLD INNER MOTTO FRAME */}
          <path
            d="M 45,54 C 45,40 68,34 100,34 C 132,34 155,40 155,54 L 155,120 L 100,165 L 45,120 Z"
            fill="url(#crestGoldGradient)"
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* 4. MOTTO INSCRIPTIONS */}
          {/* Top: EDUCATION FOR LIFE */}
          <text
            fontSize="8.5"
            fontWeight="900"
            fontFamily="'Arial Black', Impact, sans-serif"
            fill="#1E293B"
            letterSpacing="0.6"
          >
            <textPath href="#top-motto-path" startOffset="50%" textAnchor="middle">
              EDUCATION FOR LIFE
            </textPath>
          </text>

          {/* Left: IMFUNDO */}
          <text
            x="52"
            y="92"
            fontSize="8"
            fontWeight="900"
            fontFamily="'Arial Black', sans-serif"
            fill="#1E293B"
            transform="rotate(-90 52,92)"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            IMFUNDO
          </text>

          {/* Right: YOWUPENYU */}
          <text
            x="148"
            y="92"
            fontSize="7.5"
            fontWeight="900"
            fontFamily="'Arial Black', sans-serif"
            fill="#1E293B"
            transform="rotate(90 148,92)"
            textAnchor="middle"
            letterSpacing="0.4"
          >
            YOWUPENYU
          </text>

          {/* Bottom Left: TEMPILO */}
          <text
            x="70"
            y="145"
            fontSize="7.5"
            fontWeight="900"
            fontFamily="'Arial Black', sans-serif"
            fill="#1E293B"
            transform="rotate(40 70,145)"
            textAnchor="middle"
            letterSpacing="0.4"
          >
            TEMPILO
          </text>

          {/* Bottom Right: DZIDZO */}
          <text
            x="130"
            y="145"
            fontSize="7.5"
            fontWeight="900"
            fontFamily="'Arial Black', sans-serif"
            fill="#1E293B"
            transform="rotate(-40 130,145)"
            textAnchor="middle"
            letterSpacing="0.4"
          >
            DZIDZO
          </text>

          {/* 5. CENTER WHITE SHIELD PLAQUE */}
          <rect
            x="58"
            y="56"
            width="84"
            height="76"
            rx="8"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="2.5"
          />

          {/* 6. RED CROWN AT TOP OF WHITE PLAQUE */}
          <path
            d="M 74,70 L 74,58 L 86,65 L 100,54 L 114,65 L 126,58 L 126,70 Z"
            fill="#EF4444"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* 7. RED OPEN BOOK EMBLEM WITH DADAYA */}
          <path
            d="M 64,82 C 78,75 94,78 100,83 C 106,78 122,75 136,82 L 136,104 C 122,97 106,100 100,105 C 94,100 78,97 64,104 Z"
            fill="#EF4444"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1="100" y1="83" x2="100" y2="105" stroke="#1E293B" strokeWidth="2" />

          {/* DADAYA Text on the Book */}
          <text
            x="100"
            y="96"
            fontSize="10"
            fontWeight="900"
            fontFamily="'Arial Black', Impact, sans-serif"
            fill="#111827"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            DADAYA
          </text>

          {/* 8. RED PEN NIB */}
          <path
            d="M 96,105 L 104,105 L 101,126 L 99,126 Z"
            fill="#EF4444"
            stroke="#1E293B"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* 9. BOTTOM TEXT: COMPLETE "HIGH" AND "SCHOOL" */}
          {/* Left Arc: HIGH */}
          <text
            fontSize="15"
            fontWeight="900"
            fontFamily="'Arial Black', Impact, sans-serif"
            fill="#0F172A"
            letterSpacing="0.8"
          >
            <textPath href="#crest-high-path" startOffset="50%" textAnchor="middle">
              HIGH
            </textPath>
          </text>

          {/* Right Arc: SCHOOL (Complete with S-C-H-O-O-L) */}
          <text
            fontSize="15"
            fontWeight="900"
            fontFamily="'Arial Black', Impact, sans-serif"
            fill="#0F172A"
            letterSpacing="0.8"
          >
            <textPath href="#crest-school-path" startOffset="50%" textAnchor="middle">
              SCHOOL
            </textPath>
          </text>
        </svg>
      </div>

      {showSubtitle && (
        <div className="text-center mt-2">
          <h1 className="font-extrabold text-emerald-950 tracking-wider text-sm uppercase">
            Dadaya High School
          </h1>
          <p className="text-[10px] text-emerald-700 font-bold tracking-wide uppercase">
            Attendance System
          </p>
        </div>
      )}
    </div>
  );
};


