"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

interface Props {
  temp1: number;
  temp2: number;
}

export default function TempChart({ temp1, temp2 }: Props) {
  const data = {
    labels: ["Sensor 1", "Sensor 2"],
    datasets: [
      {
        label: "Temperature (°C)",
        data: [temp1, temp2],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.2)",
      },
    ],
  };

  return <Line data={data} />;
}
