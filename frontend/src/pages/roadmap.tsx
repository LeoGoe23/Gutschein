import { Box } from '@mui/material';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';

export default function HomeLayout() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      <Box sx={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#f4f4f4', overflow: 'hidden' }}>
        
        <LogoTopLeft />

        <Box sx={{ position: 'absolute', top: '1.5rem', right: '4rem', zIndex: 3 }}>
          <TopBar />
        </Box>

        {/* Straße weiter unten */}
        <Box sx={{ position: 'absolute', top: '10rem', left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <svg
            viewBox="0 0 2566 1054"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: 'auto' }}
            preserveAspectRatio="xMinYMin meet"
          >
            <defs>
              <linearGradient id="paint0_linear_22_12" x1="1293" y1="1" x2="1293" y2="1825" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C0C9CD" />
                <stop offset="0.600962" stopColor="#7D96A4" />
              </linearGradient>
            </defs>
            <path
              d="M1481 217C1481 77 572.906 36.3548 1 1V77C429.86 102.37 1079.82 97.3506 1101 217C1122.18 336.649 467.888 302.349 445 565C422.112 827.651 1629.39 862.123 2565 1053V765C1802.47 647.725 700.959 710.262 689 565C677.041 419.738 1481 357 1481 217Z"
              fill="url(#paint0_linear_22_12)"
            />
          </svg>
        </Box>

      </Box>

    </Box>
  );
}
