import React from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";

interface AnalyticsIconProps {
  size?: number;
  color?: string;
}

export function AnalyticsIcon({
  size = 26,
  color = "#5A5A6E",
}: AnalyticsIconProps) {
  const strokeWidth = 2.5;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
        {/* Bar 1 */}
        <Rect x="30" y="120" width="25" height="60" fill={color} rx="3" />

        {/* Bar 2 */}
        <Rect x="70" y="90" width="25" height="90" fill={color} rx="3" />

        {/* Bar 3 */}
        <Rect x="110" y="110" width="25" height="70" fill={color} rx="3" />

        {/* Bar 4 */}
        <Rect x="150" y="60" width="25" height="120" fill={color} rx="3" />

        {/* Line graph - connecting circles and lines */}
        {/* Line segments */}
        <Line
          x1="50"
          y1="100"
          x2="90"
          y2="70"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Line
          x1="90"
          y1="70"
          x2="130"
          y2="85"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Line
          x1="130"
          y1="85"
          x2="170"
          y2="30"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Circle points */}
        <Circle cx="50" cy="100" r="6" fill={color} />
        <Circle cx="90" cy="70" r="6" fill={color} />
        <Circle cx="130" cy="85" r="6" fill={color} />
        <Circle cx="170" cy="30" r="6" fill={color} />
      </Svg>
    </View>
  );
}
