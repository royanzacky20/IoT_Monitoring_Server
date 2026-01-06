// components/StatusBadge.tsx
import React from "react";

interface StatusBadgeProps {
  status: "online" | "offline" | "warning";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    online: {
      color: "bg-green-500",
      pulseColor: "bg-green-400",
      label: "Online",
    },
    offline: {
      color: "bg-red-500",
      pulseColor: "bg-red-400",
      label: "Offline",
    },
    warning: {
      color: "bg-yellow-500",
      pulseColor: "bg-yellow-400",
      label: "Warning",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full ${config.color} animate-pulse`}
        ></div>
        <div
          className={`absolute inset-0 w-3 h-3 rounded-full ${config.pulseColor} animate-ping opacity-75`}
        ></div>
      </div>
      <span className="text-sm font-medium text-gray-700">{config.label}</span>
    </div>
  );
};

export default StatusBadge;
