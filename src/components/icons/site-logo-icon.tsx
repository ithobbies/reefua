import type React from 'react';

const SiteLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 70 65" // Adjusted for better visual balance of elements
    {...props}
  >
    <style>
      {`
        .logo-text {
          font-family: 'Inter', sans-serif;
          font-weight: 700; /* Bold */
          fill: hsl(var(--primary));
          dominant-baseline: alphabetical;
          text-anchor: start;
        }
        .coral-shape {
          fill: hsl(var(--accent));
        }
      `}
    </style>
    {/* R */}
    <text x="0" y="36" className="logo-text" fontSize="38">R</text>
    {/* U */}
    <text x="0" y="62" className="logo-text" fontSize="38">U</text>
    {/* A */}
    <text x="35" y="62" className="logo-text" fontSize="38">A</text>
    
    {/* Coral Shape - approximation of the provided logo, translated */}
    <path
      className="coral-shape"
      d="M 33 32 
         C 31 32, 28 31.5, 27 29 
         C 26 26.5, 26.5 23.5, 25 22 
         C 23.5 20.5, 21 21, 20 19 
         C 19 17, 20.5 14, 23 13 
         C 25.5 12, 28 14, 29 16.5 
         C 30 19, 33 19.5, 35 18 
         C 37 16.5, 39 17, 40 19 
         C 41 21, 40 24, 38 25 
         C 36 26, 35 25.5, 34 27.5 
         C 33 29.5, 34 32, 33 32 Z"
    />
  </svg>
);

export default SiteLogoIcon;
