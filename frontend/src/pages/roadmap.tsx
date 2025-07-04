import { Box } from "@mui/material";
import TopBar from "../components/home/TopBar";
import LogoTopLeft from "../components/home/TopLeftLogo";

export default function SvgPage() {
  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        backgroundColor: "#f4f4f4",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "auto",
          padding: "1rem",
        }}
      >
        <LogoTopLeft />
        <Box
          sx={{
            position: "absolute",
            top: { xs: "0.5rem", md: "1.5rem" },
            right: { xs: "1rem", md: "4rem" },
            zIndex: 3,
          }}
        >
          <TopBar />
        </Box>
      </Box>

      <Box sx={{ width: "100%", minHeight: "100vh", display: "flex", marginTop: 0 }}>
        <Box
          sx={{
            width: "50%",
            minHeight: "100vh",
            overflow: "visible", // Changed from 'hidden' to 'visible' to prevent SVG clipping
            marginLeft: "-20px",
          }}
        >
          <svg
            style={{ marginTop: "100px" }}
            width="100%"
            height="auto"
            viewBox="0 0 2025 2517"
            preserveAspectRatio="xMinYMin slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2024.43 657.746C2024.43 401.745 812.259 267.279 0.433594 301V581C560.966 492.744 1281.4 489.745 1281.4 657.746C1281.4 825.746 296.595 1021.5 244 1465C191.405 1908.5 780 2517 888 2517H1476C1476 2517 748.909 1790.11 756 1465C763.091 1139.89 2024.43 913.746 2024.43 657.746Z" fill="url(#paint0_linear_0_1)" />
            <path opacity="0.2" d="M296 416.267C332.341 416.267 361.8 409.581 361.8 401.333C361.8 393.086 332.341 386.4 296 386.4C259.66 386.4 230.2 393.086 230.2 401.333C230.2 409.581 259.66 416.267 296 416.267Z" fill="black" />
            <path d="M296 37.3334C371.2 37.3334 427.6 93.3334 427.6 168C427.6 242.667 296 373.333 296 373.333C296 373.333 164.4 242.667 164.4 168C164.4 93.3334 220.8 37.3334 296 37.3334Z" fill="url(#paint1_linear_0_1)" stroke="#D35400" strokeWidth="2" />
            <path d="M296 233.333C332.341 233.333 361.8 204.083 361.8 168C361.8 131.917 332.341 102.667 296 102.667C259.66 102.667 230.2 131.917 230.2 168C230.2 204.083 259.66 233.333 296 233.333Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2" />
            <path d="M267.8 168L286.6 186.667L324.2 149.333" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path opacity="0.2" d="M1264 969.267C1300.34 969.267 1329.8 962.581 1329.8 954.333C1329.8 946.086 1300.34 939.4 1264 939.4C1227.66 939.4 1198.2 946.086 1198.2 954.333C1198.2 962.581 1227.66 969.267 1264 969.267Z" fill="black" />
            <path d="M1264 590.333C1339.2 590.333 1395.6 646.333 1395.6 721C1395.6 795.667 1264 926.333 1264 926.333C1264 926.333 1132.4 795.667 1132.4 721C1132.4 646.333 1188.8 590.333 1264 590.333Z" fill="url(#paint2_linear_0_1)" stroke="#D35400" strokeWidth="2" />
            <path d="M1264 786.333C1300.34 786.333 1329.8 757.083 1329.8 721C1329.8 684.917 1300.34 655.667 1264 655.667C1227.66 655.667 1198.2 684.917 1198.2 721C1198.2 757.083 1227.66 786.333 1264 786.333Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2" />
            <path d="M1235.8 721L1254.6 739.667L1292.2 702.333" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path opacity="0.2" d="M540 1619.27C576.341 1619.27 605.8 1612.58 605.8 1604.33C605.8 1596.09 576.341 1589.4 540 1589.4C503.66 1589.4 474.2 1596.09 474.2 1604.33C474.2 1612.58 503.66 1619.27 540 1619.27Z" fill="black" />
            <path d="M540 1240.33C615.2 1240.33 671.6 1296.33 671.6 1371C671.6 1445.67 540 1576.33 540 1576.33C540 1576.33 408.4 1445.67 408.4 1371C408.4 1296.33 464.8 1240.33 540 1240.33Z" fill="#96DF96" stroke="#D35400" strokeWidth="2" />
            <path d="M540 1436.33C576.341 1436.33 605.8 1407.08 605.8 1371C605.8 1334.92 576.341 1305.67 540 1305.67C503.66 1305.67 474.2 1334.92 474.2 1371C474.2 1407.08 503.66 1436.33 540 1436.33Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2" />
            <path d="M511.8 1371L530.6 1389.67L568.2 1352.33" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path opacity="0.2" d="M1012 2389.27C1048.34 2389.27 1077.8 2382.58 1077.8 2374.33C1077.8 2366.09 1048.34 2359.4 1012 2359.4C975.66 2359.4 946.2 2366.09 946.2 2374.33C946.2 2382.58 975.66 2389.27 1012 2389.27Z" fill="black" />
            <path d="M1012 2010.33C1087.2 2010.33 1143.6 2066.33 1143.6 2141C1143.6 2215.67 1012 2346.33 1012 2346.33C1012 2346.33 880.4 2215.67 880.4 2141C880.4 2066.33 936.8 2010.33 1012 2010.33Z" fill="url(#paint3_linear_0_1)" stroke="#D35400" strokeWidth="2" />
            <path d="M1012 2206.33C1048.34 2206.33 1077.8 2177.08 1077.8 2141C1077.8 2104.92 1048.34 2075.67 1012 2075.67C975.66 2075.67 946.2 2104.92 946.2 2141C946.2 2177.08 975.66 2206.33 1012 2206.33Z" fill="#2C3E50" stroke="#34495E" strokeWidth="2" />
            <path d="M983.8 2141L1002.6 2159.67L1040.2 2122.33" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="paint0_linear_0_1" x1="1012.22" y1="295.881" x2="1012.22" y2="4057.75" gradientUnits="userSpaceOnUse">
                <stop offset="0.0192308" stopColor="#D7C5C5" />
                <stop offset="0.942308" stopColor="#737373" />
              </linearGradient>
              <linearGradient id="paint1_linear_0_1" x1="164.4" y1="37.3334" x2="32786.9" y2="25591.6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F2BB79" />
                <stop offset="1" stopColor="#FF4500" />
              </linearGradient>
              <linearGradient id="paint2_linear_0_1" x1="1132.4" y1="590.333" x2="33754.9" y2="26144.6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8D5C8" />
                <stop offset="1" stopColor="#FF4500" />
              </linearGradient>
              <linearGradient id="paint3_linear_0_1" x1="880.4" y1="2010.33" x2="33502.9" y2="27564.6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8C00" />
                <stop offset="1" stopColor="#FF4500" />
              </linearGradient>
            </defs>
          </svg>
        </Box>

        <Box sx={{ width: "50%", minHeight: "100vh" }}>
          {/* Rechte Seite für Content */}
        </Box>
      </Box>
    </Box>
  );
}
