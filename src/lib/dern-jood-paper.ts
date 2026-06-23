export type DernJoodPaperPatternId = "circle" | "mixed";
export type DernJoodPaperShape = "circle" | "square" | "triangle";
export type DernJoodPaperShapeFilter = "all" | DernJoodPaperShape;
export type DernJoodPaperColor = "red" | "yellow" | "purple";
export type DernJoodPaperColorFilter = "all" | DernJoodPaperColor;

export interface DernJoodPaperPoint {
  id: number;
  x: number;
  y: number;
  shape?: DernJoodPaperShape;
  color?: DernJoodPaperColor;
}

export interface DernJoodPaperPattern {
  id: DernJoodPaperPatternId;
  label: string;
  svg: string;
  leftHandPoints: DernJoodPaperPoint[];
  rightHandPoints: DernJoodPaperPoint[];
}

export const DERN_JOOD_PAPER_SIZE = {
  width: 1917,
  height: 2508,
};

const circleLeftHandPoints: DernJoodPaperPoint[] = [
  { id: 0, x: 603.5, y: 113.5, color: "red" },
  { id: 1, x: 688.5, y: 302.5, color: "purple" },
  { id: 2, x: 744.5, y: 460.5, color: "red" },
  { id: 3, x: 804.5, y: 665.5, color: "yellow" },
  { id: 4, x: 580.5, y: 686.5, color: "red" },
  { id: 5, x: 356.5, y: 723.5, color: "yellow" },
  { id: 6, x: 453.5, y: 846.5, color: "purple" },
  { id: 7, x: 593.5, y: 987.5, color: "red" },
  { id: 8, x: 764.5, y: 1179.5, color: "purple" },
  { id: 9, x: 651.5, y: 1179.5, color: "yellow" },
  { id: 10, x: 505.5, y: 1165.5, color: "purple" },
  { id: 11, x: 336.5, y: 1165.5, color: "red" },
  { id: 12, x: 453.5, y: 1254.5, color: "yellow" },
  { id: 13, x: 556.5, y: 1315.5, color: "purple" },
  { id: 14, x: 689.5, y: 1412.5, color: "yellow" },
  { id: 15, x: 580.5, y: 1412.5, color: "red" },
  { id: 16, x: 444.5, y: 1439.5, color: "yellow" },
  { id: 17, x: 261.5, y: 1439.5, color: "purple" },
  { id: 18, x: 289.5, y: 1527.5, color: "red" },
  { id: 19, x: 318.5, y: 1623.5, color: "yellow" },
  { id: 20, x: 430.5, y: 1691.5, color: "purple" },
  { id: 21, x: 519.5, y: 1654.5, color: "red" },
  { id: 22, x: 603.5, y: 1602.5, color: "purple" },
  { id: 23, x: 764.5, y: 1542.5, color: "yellow" },
  { id: 24, x: 764.5, y: 1660.5, color: "red" },
  { id: 25, x: 764.5, y: 1747.5, color: "purple" },
  { id: 26, x: 764.5, y: 1841.5, color: "yellow" },
  { id: 27, x: 764.5, y: 1935.5, color: "red" },
  { id: 28, x: 528.5, y: 1992.5, color: "yellow" },
  { id: 29, x: 430.5, y: 2010.5, color: "yellow" },
  { id: 30, x: 261.5, y: 2030.5, color: "purple" },
  { id: 31, x: 318.5, y: 2105.5, color: "red" },
  { id: 32, x: 444.5, y: 2243.5, color: "yellow" },
  { id: 33, x: 505.5, y: 2318.5, color: "purple" },
  { id: 34, x: 580.5, y: 2393.5, color: "red" },
];

const circleRightHandPoints: DernJoodPaperPoint[] = [
  { id: 0, x: 1220.5, y: 76.5, color: "purple" },
  { id: 1, x: 1183.5, y: 164.5, color: "purple" },
  { id: 2, x: 1145.5, y: 265.5, color: "yellow" },
  { id: 3, x: 1108.5, y: 365.5, color: "red" },
  { id: 4, x: 1064.5, y: 460.5, color: "purple" },
  { id: 5, x: 1033.5, y: 553.5, color: "red" },
  { id: 6, x: 1269.5, y: 628.5, color: "yellow" },
  { id: 7, x: 1539.5, y: 703.5, color: "yellow" },
  { id: 8, x: 1440.5, y: 740.5, color: "red" },
  { id: 9, x: 1328.5, y: 798.5, color: "purple" },
  { id: 10, x: 1102.5, y: 884.5, color: "red" },
  { id: 11, x: 1178.5, y: 957.5, color: "yellow" },
  { id: 12, x: 1277.5, y: 1061.5, color: "purple" },
  { id: 13, x: 1489.5, y: 1250.5, color: "yellow" },
  { id: 14, x: 1383.5, y: 1225.5, color: "red" },
  { id: 15, x: 1277.5, y: 1199.5, color: "yellow" },
  { id: 16, x: 1160.5, y: 1165.5, color: "red" },
  { id: 17, x: 1047.5, y: 1144.5, color: "purple" },
  { id: 18, x: 1065.5, y: 1370.5, color: "yellow" },
  { id: 19, x: 1084.5, y: 1512.5, color: "red" },
  { id: 20, x: 1103.5, y: 1654.5, color: "yellow" },
  { id: 21, x: 1628.5, y: 1542.5, color: "purple" },
  { id: 22, x: 1577.5, y: 1728.5, color: "red" },
  { id: 23, x: 1478.5, y: 1904.5, color: "purple" },
  { id: 24, x: 993.5, y: 1816.5, color: "yellow" },
  { id: 25, x: 1085.5, y: 1904.5, color: "red" },
  { id: 26, x: 1178.5, y: 1972.5, color: "purple" },
  { id: 27, x: 1403.5, y: 2126.5, color: "yellow" },
  { id: 28, x: 1178.5, y: 2180.5, color: "red" },
  { id: 29, x: 1068.5, y: 2201.5, color: "yellow" },
  { id: 30, x: 958.5, y: 2217.5, color: "purple" },
  { id: 31, x: 842.5, y: 2252.5, color: "yellow" },
  { id: 32, x: 958.5, y: 2317.5, color: "red" },
  { id: 33, x: 1068.5, y: 2364.5, color: "purple" },
  { id: 34, x: 1178.5, y: 2415.5, color: "red" },
];

const mixedLeftHandPoints: DernJoodPaperPoint[] = [
  { id: 0, x: 680.5, y: 2430.5, shape: "circle", color: "yellow" },
  { id: 1, x: 618.5, y: 2267.5, shape: "square", color: "purple" },
  { id: 2, x: 693.5, y: 2140.5, shape: "circle", color: "red" },
  { id: 3, x: 528.0, y: 2103.0, shape: "triangle", color: "purple" },
  { id: 4, x: 475.5, y: 1957.5, shape: "square", color: "yellow" },
  { id: 5, x: 603.0, y: 1847.0, shape: "triangle", color: "red" },
  { id: 6, x: 550.5, y: 1757.5, shape: "circle", color: "yellow" },
  { id: 7, x: 475.5, y: 1661.5, shape: "square", color: "red" },
  { id: 8, x: 729.0, y: 1547.0, shape: "triangle", color: "red" },
  { id: 9, x: 731.5, y: 1401.5, shape: "square", color: "purple" },
  { id: 10, x: 488.0, y: 1426.0, shape: "triangle", color: "purple" },
  { id: 11, x: 475.5, y: 1191.5, shape: "circle", color: "red" },
  { id: 12, x: 649.0, y: 1273.0, shape: "triangle", color: "yellow" },
  { id: 13, x: 772.0, y: 1138.0, shape: "triangle", color: "red" },
  { id: 14, x: 618.5, y: 1122.5, shape: "circle", color: "purple" },
  { id: 15, x: 590.0, y: 1003.0, shape: "triangle", color: "red" },
  { id: 16, x: 827.5, y: 924.5, shape: "circle", color: "yellow" },
  { id: 17, x: 653.0, y: 871.0, shape: "triangle", color: "yellow" },
  { id: 18, x: 475.5, y: 817.5, shape: "square", color: "purple" },
  { id: 19, x: 680.5, y: 701.5, shape: "circle", color: "yellow" },
  { id: 20, x: 769.5, y: 576.5, shape: "square", color: "purple" },
  { id: 21, x: 568.5, y: 576.5, shape: "square", color: "yellow" },
  { id: 22, x: 473.0, y: 441.0, shape: "triangle", color: "red" },
  { id: 23, x: 658.0, y: 417.0, shape: "triangle", color: "purple" },
  { id: 24, x: 830.0, y: 401.0, shape: "triangle", color: "yellow" },
  { id: 25, x: 618.5, y: 249.5, shape: "circle", color: "purple" },
  { id: 26, x: 790.5, y: 116.5, shape: "square", color: "red" },
];

const mixedRightHandPoints: DernJoodPaperPoint[] = [
  { id: 0, x: 1318.5, y: 93.5, shape: "circle", color: "red" },
  { id: 1, x: 1218.5, y: 300.5, shape: "square", color: "yellow" },
  { id: 2, x: 1573.0, y: 263.0, shape: "triangle", color: "red" },
  { id: 3, x: 1493.0, y: 441.0, shape: "triangle", color: "purple" },
  { id: 4, x: 1092.5, y: 613.5, shape: "circle", color: "red" },
  { id: 5, x: 1256.0, y: 651.0, shape: "triangle", color: "yellow" },
  { id: 6, x: 1430.5, y: 664.5, shape: "square", color: "purple" },
  { id: 7, x: 1181.0, y: 815.0, shape: "triangle", color: "red" },
  { id: 8, x: 867.5, y: 817.5, shape: "circle", color: "purple" },
  { id: 9, x: 1017.5, y: 892.5, shape: "square", color: "yellow" },
  { id: 10, x: 1128.0, y: 1058.0, shape: "triangle", color: "purple" },
  { id: 11, x: 1379.5, y: 1135.5, shape: "circle", color: "yellow" },
  { id: 12, x: 1221.0, y: 1233.0, shape: "triangle", color: "yellow" },
  { id: 13, x: 1054.5, y: 1350.5, shape: "square", color: "red" },
  { id: 14, x: 1280.5, y: 1425.5, shape: "square", color: "purple" },
  { id: 15, x: 1130.5, y: 1699.5, shape: "circle", color: "red" },
  { id: 16, x: 1355.5, y: 1570.5, shape: "circle", color: "yellow" },
  { id: 17, x: 1390.0, y: 1730.0, shape: "triangle", color: "purple" },
  { id: 18, x: 1392.5, y: 1889.5, shape: "square", color: "yellow" },
  { id: 19, x: 1216.0, y: 1880.0, shape: "triangle", color: "red" },
  { id: 20, x: 996.5, y: 1882.5, shape: "circle", color: "purple" },
  { id: 21, x: 1095.0, y: 2138.0, shape: "triangle", color: "red" },
  { id: 22, x: 1304.5, y: 2082.5, shape: "square", color: "purple" },
  { id: 23, x: 1433.0, y: 2283.0, shape: "triangle", color: "yellow" },
  { id: 24, x: 1219.0, y: 2230.0, shape: "triangle", color: "purple" },
  { id: 25, x: 1034.5, y: 2305.5, shape: "circle", color: "yellow" },
  { id: 26, x: 1304.5, y: 2429.5, shape: "square", color: "red" },
];

export const DERN_JOOD_PAPER_SHAPE_FILTERS: Array<{
  id: DernJoodPaperShapeFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "circle", label: "Circle" },
  { id: "square", label: "Square" },
  { id: "triangle", label: "Triangle" },
];

export const DERN_JOOD_PAPER_COLOR_FILTERS: Array<{
  id: DernJoodPaperColorFilter;
  label: string;
  swatch: string;
}> = [
  { id: "all", label: "All", swatch: "#71717a" },
  { id: "red", label: "Red", swatch: "#ef4444" },
  { id: "yellow", label: "Yellow", swatch: "#facc15" },
  { id: "purple", label: "Purple", swatch: "#351360" },
];

export const DERN_JOOD_PAPER_PATTERNS: DernJoodPaperPattern[] = [
  {
    id: "circle",
    label: "Circle",
    svg: "/images/dern-jood/circle-dernjood.svg",
    leftHandPoints: circleLeftHandPoints,
    rightHandPoints: circleRightHandPoints,
  },
  {
    id: "mixed",
    label: "Mixed",
    svg: "/images/dern-jood/mixed-dernjood.svg",
    leftHandPoints: mixedLeftHandPoints,
    rightHandPoints: mixedRightHandPoints,
  },
];
