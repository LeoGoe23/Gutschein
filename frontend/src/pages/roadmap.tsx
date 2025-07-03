import { Box } from '@mui/material';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';

export default function HomeLayout() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowY: 'auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4' }}>
      
      <Box sx={{ position: 'relative', width: '100%', height: '8rem' }}>
        <LogoTopLeft />
        <Box sx={{ position: 'absolute', top: '1.5rem', right: '4rem', zIndex: 3 }}>
          <TopBar />
        </Box>
      </Box>

      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: '2566px' }}>
          <svg width="2566" height="1321" viewBox="0 0 2566 1321" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
            
            <path d="M1481 484C1481 344 572.906 303.355 1 268V344C429.86 369.37 1079.82 364.351 1101 484C1122.18 603.649 467.888 569.349 445 832C422.112 1094.65 1629.39 1129.12 2565 1320V1032C1802.47 914.725 700.959 977.262 689 832C677.041 686.738 1481 624 1481 484Z" fill="url(#paint0_linear_0_1)" stroke="black"/>

            <g>
              <path opacity="0.2" d="M1077 416.267C1113.34 416.267 1142.8 409.581 1142.8 401.333C1142.8 393.086 1113.34 386.4 1077 386.4C1040.66 386.4 1011.2 393.086 1011.2 401.333C1011.2 409.581 1040.66 416.267 1077 416.267Z" fill="black"/>
              <path d="M1077 37.3333C1152.2 37.3333 1208.6 93.3333 1208.6 168C1208.6 242.667 1077 373.333 1077 373.333C1077 373.333 945.4 242.667 945.4 168C945.4 93.3333 1001.8 37.3333 1077 37.3333Z" fill="url(#paint1_linear_0_1)" stroke="#D35400" strokeWidth="2"/>
              <path d="M1077 233.333C1113.34 233.333 1142.8 204.083 1142.8 168C1142.8 131.917 1113.34 102.667 1077 102.667C1040.66 102.667 1011.2 131.917 1011.2 168C1011.2 204.083 1040.66 233.333 1077 233.333Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2"/>
              <path d="M1048.8 168L1067.6 186.667L1105.2 149.333" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="1180" y="180" fontSize="22" fill="#333" fontWeight="600">Start</text>
            </g>

            <g>
              <path opacity="0.2" d="M2353 1172.27C2389.34 1172.27 2418.8 1165.58 2418.8 1157.33C2418.8 1149.09 2389.34 1142.4 2353 1142.4C2316.66 1142.4 2287.2 1149.09 2287.2 1157.33C2287.2 1165.58 2316.66 1172.27 2353 1172.27Z" fill="black"/>
              <path d="M2353 793.333C2428.2 793.333 2484.6 849.333 2484.6 924C2484.6 998.667 2353 1129.33 2353 1129.33C2353 1129.33 2221.4 998.667 2221.4 924C2221.4 849.333 2277.8 793.333 2353 793.333Z" fill="url(#paint2_linear_0_1)" stroke="#D35400" strokeWidth="2"/>
              <path d="M2353 989.333C2389.34 989.333 2418.8 960.083 2418.8 924C2418.8 887.917 2389.34 858.667 2353 858.667C2316.66 858.667 2287.2 887.917 2287.2 924C2287.2 960.083 2316.66 989.333 2353 989.333Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2"/>
              <path d="M2324.8 924L2343.6 942.667L2381.2 905.333" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="2460" y="920" fontSize="22" fill="#333" fontWeight="600">Ziel</text>
            </g>

            <g>
              <path opacity="0.2" d="M625 762.267C661.34 762.267 690.8 755.581 690.8 747.333C690.8 739.086 661.34 732.4 625 732.4C588.66 732.4 559.2 739.086 559.2 747.333C559.2 755.581 588.66 762.267 625 762.267Z" fill="black"/>
              <path d="M625 383.333C700.2 383.333 756.6 439.333 756.6 514C756.6 588.667 625 719.333 625 719.333C625 719.333 493.4 588.667 493.4 514C493.4 439.333 549.8 383.333 625 383.333Z" fill="url(#paint3_linear_0_1)" stroke="#D35400" strokeWidth="2"/>
              <path d="M625 579.333C661.34 579.333 690.8 550.083 690.8 514C690.8 477.917 661.34 448.667 625 448.667C588.66 448.667 559.2 477.917 559.2 514C559.2 550.083 588.66 579.333 625 579.333Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2"/>
              <path d="M596.8 514L615.6 532.667L653.2 495.333" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="730" y="520" fontSize="22" fill="#333" fontWeight="600">Planung</text>
            </g>

            <g>
              <path opacity="0.2" d="M1411 1060.27C1447.34 1060.27 1476.8 1053.58 1476.8 1045.33C1476.8 1037.09 1447.34 1030.4 1411 1030.4C1374.66 1030.4 1345.2 1037.09 1345.2 1045.33C1345.2 1053.58 1374.66 1060.27 1411 1060.27Z" fill="black"/>
              <path d="M1411 681.333C1486.2 681.333 1542.6 737.333 1542.6 812C1542.6 886.667 1411 1017.33 1411 1017.33C1411 1017.33 1279.4 886.667 1279.4 812C1279.4 737.333 1335.8 681.333 1411 681.333Z" fill="url(#paint4_linear_0_1)" stroke="#D35400" strokeWidth="2"/>
              <path d="M1411 877.333C1447.34 877.333 1476.8 848.083 1476.8 812C1476.8 775.917 1447.34 746.667 1411 746.667C1374.66 746.667 1345.2 775.917 1345.2 812C1345.2 848.083 1374.66 877.333 1411 877.333Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2"/>
              <path d="M1382.8 812L1401.6 830.667L1439.2 793.333" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="1520" y="810" fontSize="22" fill="#333" fontWeight="600">Umsetzung</text>
            </g>

            <defs>
              <linearGradient id="paint0_linear_0_1" x1="1293" y1="268" x2="1293" y2="2092" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C0C9CD"/>
                <stop offset="0.600962" stopColor="#7D96A4"/>
              </linearGradient>
              <linearGradient id="paint1_linear_0_1" x1="945.4" y1="37.3333" x2="33567.9" y2="25591.6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8C00"/>
                <stop offset="1" stopColor="#FF4500"/>
              </linearGradient>
              <linearGradient id="paint2_linear_0_1" x1="2221.4" y1="793.333" x2="34843.9" y2="26347.6" gradientUnits="userSpaceOnUse">
                <stop offset="0.0432692" stopColor="#FF8C00"/>
                <stop offset="1" stopColor="#FF4500"/>
              </linearGradient>
              <linearGradient id="paint3_linear_0_1" x1="493.4" y1="383.333" x2="33115.9" y2="25937.6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8C00"/>
                <stop offset="1" stopColor="#FF4500"/>
              </linearGradient>
              <linearGradient id="paint4_linear_0_1" x1="1279.4" y1="681.333" x2="33901.9" y2="26235.6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8C00"/>
                <stop offset="1" stopColor="#FF4500"/>
              </linearGradient>
            </defs>
          </svg>
        </Box>
      </Box>
    </Box>
  );
}
