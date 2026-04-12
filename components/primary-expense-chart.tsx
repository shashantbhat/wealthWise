import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface PrimarySvgExpenseChartProps {
  categories: Record<string, number>;
  total: number;
}

const COLORS = [
  "#FF6B6B", // Food
  "#4ECDC4", // Travel
  "#FFE66D", // Shopping
  "#95E1D3", // Health
  "#C7CEEA", // Entertainment
  "#FF9F43", // Accommodation
  "#A8E6CF", // Wellness
  "#F8B500", // Default
];

export default function PrimarySvgExpenseChart({
  categories,
  total,
}: PrimarySvgExpenseChartProps) {
  if (total === 0) {
    return (
      <View className="items-center justify-center h-64">
        <Text className="text-gray-500 text-lg">No spending data</Text>
      </View>
    );
  }

  // Prepare data for pie chart
  const chartData = Object.entries(categories)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount], index) => ({
      name,
      amount,
      percentage: (amount / total) * 100,
      color: COLORS[index % COLORS.length],
    }));

  // Calculate pie slices
  const radius = 80;
  const centerX = 110;
  const centerY = 110;

  let currentAngle = -90; // Start from top
  const slices = chartData.map((item) => {
    const sliceAngle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate path points
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = `
      M ${centerX} ${centerY}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `;

    currentAngle = endAngle;

    return {
      ...item,
      pathData,
      midAngle: startAngle + sliceAngle / 2,
    };
  });

  return (
    <View className="w-full">
      <View className="items-center">
        <Svg width="220" height="220" viewBox="0 0 220 220">
          {slices.map((slice, index) => (
            <Path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              strokeWidth="1"
              stroke="#fff"
            />
          ))}
          {/* Center circle for donut effect */}
          <Circle
            cx={centerX}
            cy={centerY}
            r="40"
            fill="white"
            stroke="#f0f0f0"
            strokeWidth="1"
          />
        </Svg>
      </View>

      {/* Legend */}
      <View className="mt-6 bg-gray-50 rounded-lg p-4">
        {chartData.map((item, index) => (
          <View
            key={index}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-4 h-4 rounded mr-3"
                style={{ backgroundColor: item.color }}
              />
              <Text className="font-semibold text-sm flex-1">{item.name}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-gray-600 text-sm">
                {item.percentage.toFixed(1)}%
              </Text>
              <Text className="font-bold text-sm">
                ₹{item.amount.toFixed(0)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
