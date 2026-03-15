import React from "react";
import { Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const RING_SIZE = Math.min(SCREEN_WIDTH * 0.62, 240);
const STROKE = 20;
const RING_RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function RingChart({ progress }: { progress: number }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clamped);
  const center = RING_SIZE / 2;

  return (
    <Svg
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ transform: [{ rotate: "-90deg" }] }}
    >
      <Circle
        cx={center}
        cy={center}
        r={RING_RADIUS}
        stroke="#E8E8E8"
        strokeWidth={STROKE}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={RING_RADIUS}
        stroke="#000000"
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}
