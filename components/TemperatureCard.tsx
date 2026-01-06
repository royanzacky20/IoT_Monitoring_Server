// components/TemperatureCard.tsx
import React from "react";

interface TemperatureCardProps {
  temperature: number;
  location: string;
}

const TemperatureCard: React.FC<TemperatureCardProps> = ({
  temperature,
  location,
}) => {
  const getTemperatureColor = (temp: number) => {
    if (temp < 20) return "text-blue-600 bg-blue-100";
    if (temp < 25) return "text-green-600 bg-green-100";
    if (temp < 30) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{location}</p>
          <p
            className={`text-3xl font-bold ${
              getTemperatureColor(temperature).split(" ")[0]
            }`}
          >
            {temperature}°C
          </p>
        </div>
        <div
          className={`p-3 rounded-full ${
            getTemperatureColor(temperature).split(" ")[1]
          }`}
        >
          <span className="text-2xl">🌡️</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0°C</span>
          <span>50°C</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              temperature < 20
                ? "bg-blue-500"
                : temperature < 25
                ? "bg-green-500"
                : temperature < 30
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${Math.min((temperature / 50) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureCard;
