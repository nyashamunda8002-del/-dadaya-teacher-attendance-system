import React, { useState } from 'react';

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
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: 'w-7 h-7 sm:w-8 sm:h-8',
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
    xl: 'w-28 h-28 sm:w-32 sm:h-32',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
        {!imgError ? (
          <img
            src="/dadaya-crest.jpg"
            alt="Dadaya High School Official Crest"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-sm rounded-lg"
          />
        ) : (
          /* Authentic Dadaya High School Crest SVG Fallback */
          <svg
            viewBox="0 0 120 144"
            className="w-full h-full drop-shadow-md overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Definitions for gradients & paths */}
            <defs>
              <path id="high-path" d="M 16,128 Q 30,138 48,142" fill="none" />
              <path id="school-path" d="M 72,142 Q 90,138 104,128" fill="none" />
              <path id="motto-top" d="M 34,42 Q 60,30 86,42" fill="none" />
            </defs>

            {/* 1. Outer Green Shield Base with Crest Peaks */}
            <path
              d="M 14,14 C 36,4 48,16 60,16 C 72,16 84,4 106,14 C 108,50 106,86 60,132 C 14,86 12,50 14,14 Z"
              fill="#15803D"
              stroke="#166534"
              strokeWidth="1.5"
            />

            {/* Inner White Border Trim */}
            <path
              d="M 18,18 C 38,9 49,19 60,19 C 71,19 82,9 102,18 C 103,49 101,82 60,126 C 19,82 17,49 18,18 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* 2. Yellow/Gold Inner Motto Frame */}
            <path
              d="M 25,38 C 25,28 38,24 60,24 C 82,24 95,28 95,38 L 95,84 L 60,114 L 25,84 Z"
              fill="#FBBF24"
              stroke="#1F2937"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            {/* 3. Motto Inscriptions */}
            <text
              fontSize="5.5"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill="#1F2937"
              textAnchor="middle"
            >
              <textPath href="#motto-top" startOffset="50%">
                EDUCATION FOR LIFE
              </textPath>
            </text>

            <text
              x="29"
              y="70"
              fontSize="5.2"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill="#1F2937"
              transform="rotate(-90 29,70)"
              textAnchor="middle"
            >
              IMFUNDO
            </text>

            <text
              x="91"
              y="70"
              fontSize="5.2"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill="#1F2937"
              transform="rotate(90 91,70)"
              textAnchor="middle"
            >
              YOWUPENYU
            </text>

            <text
              x="40"
              y="100"
              fontSize="5.2"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill="#1F2937"
              transform="rotate(40 40,100)"
              textAnchor="middle"
            >
              TEMPILO
            </text>
            <text
              x="80"
              y="100"
              fontSize="5.2"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill="#1F2937"
              transform="rotate(-40 80,100)"
              textAnchor="middle"
            >
              DZIDZO
            </text>

            {/* 4. Center White Plaque */}
            <rect
              x="34"
              y="35"
              width="52"
              height="55"
              rx="6"
              fill="#FFFFFF"
              stroke="#1F2937"
              strokeWidth="1.8"
            />

            {/* 5. Red Crown at top */}
            <path
              d="M 48,45 L 48,34 L 54,39 L 60,32 L 66,39 L 72,34 L 72,45 Z"
              fill="#DC2626"
              stroke="#1F2937"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            {/* 6. Open Red Book Emblem with DADAYA text */}
            <path
              d="M 37,56 C 45,51 56,53 60,57 C 64,53 75,51 83,56 L 83,73 C 75,68 64,70 60,74 C 56,70 45,68 37,73 Z"
              fill="#EF4444"
              stroke="#1F2937"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <line x1="60" y1="57" x2="60" y2="74" stroke="#1F2937" strokeWidth="1.5" />

            <text
              x="60"
              y="67"
              fontSize="7.5"
              fontWeight="900"
              fontFamily="'Arial Black', Impact, sans-serif"
              fill="#111827"
              textAnchor="middle"
            >
              DADAYA
            </text>

            {/* 7. Red Pen Nib */}
            <path
              d="M 57,74 L 63,74 L 60.5,90 L 59.5,90 Z"
              fill="#DC2626"
              stroke="#1F2937"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* 8. Outer HIGH SCHOOL Text */}
            <text
              fontSize="9"
              fontWeight="900"
              fontFamily="'Arial Black', sans-serif"
              fill="#111827"
              textAnchor="end"
            >
              <textPath href="#high-path" startOffset="90%">
                HIGH
              </textPath>
            </text>

            <text
              fontSize="9"
              fontWeight="900"
              fontFamily="'Arial Black', sans-serif"
              fill="#111827"
              textAnchor="start"
            >
              <textPath href="#school-path" startOffset="10%">
                SCHOOL
              </textPath>
            </text>
          </svg>
        )}
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
