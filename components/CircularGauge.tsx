// components/CircularGauge.tsx
import React from "react";

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  minValue?: number;
  title: string;
  unit: string;
  color?: string;
  size?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  maxValue,
  minValue = 0,
  title,
  unit,
  color = "#3B82F6",
  size = 200,
}) => {
  const radius = (size - 40) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;

  // Calculate percentage for the gauge
  const percentage = Math.min(
    Math.max((value - minValue) / (maxValue - minValue), 0),
    1
  );
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - percentage * circumference;

  // Calculate needle angle
  const angle = percentage * 270 - 135; // -135 to 135 degrees
  const needleLength = radius - 20;

  // Calculate needle end point
  const centerX = size / 2;
  const centerY = size / 2;
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const tickAngle = (i * 270) / 10 - 135;
    const tickOuterX = centerX + radius * Math.cos((tickAngle * Math.PI) / 180);
    const tickOuterY = centerY + radius * Math.sin((tickAngle * Math.PI) / 180);
    const tickInnerX =
      centerX + (radius - 15) * Math.cos((tickAngle * Math.PI) / 180);
    const tickInnerY =
      centerY + (radius - 15) * Math.sin((tickAngle * Math.PI) / 180);

    ticks.push(
      <line
        key={i}
        x1={tickInnerX}
        y1={tickInnerY}
        x2={tickOuterX}
        y2={tickOuterY}
        stroke="#E5E7EB"
        strokeWidth="2"
      />
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>

      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={normalizedRadius}
            fill="none"
            stroke="#374151"
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={normalizedRadius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out drop-shadow-lg"
          />

          {/* Tick marks */}
          {ticks}

          {/* Center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="8"
            fill="#1F2937"
            stroke="#6B7280"
            strokeWidth="2"
          />

          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="#F9FAFB"
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out drop-shadow-md"
          />

          {/* Needle center cap */}
          <circle cx={centerX} cy={centerY} r="6" fill="#F9FAFB" />
        </svg>

        {/* Value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color }}>
              {value.toFixed(1)}
            </div>
            <div className="text-sm text-gray-400">{unit}</div>
          </div>
        </div>
      </div>

      {/* Range indicators */}
      <div className="flex justify-between w-full mt-4 text-xs text-gray-400">
        <span>
          {minValue}
          {unit}
        </span>
        <span>
          {maxValue}
          {unit}
        </span>
      </div>
    </div>
  );
};

export default CircularGauge;
