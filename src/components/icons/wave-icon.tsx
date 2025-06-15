import type React from 'react';

const WaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 12C2 12 5 6 12 12C19 18 22 12 22 12" />
    <path d="M2 18C2 18 5 12 12 18C19 24 22 18 22 18" />
  </svg>
);

export default WaveIcon;
