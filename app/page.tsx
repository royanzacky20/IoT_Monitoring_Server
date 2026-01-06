"use client";

import { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import StatusBadge from "@/components/StatusBadge";
import TempChart from "@/components/TempChart";
import CircularGauge from "@/components/CircularGauge";

interface IoTData {
  temp_sensor_1: number;
  temp_sensor_2: number;
  humidity: number;
  status: string;
  ack?: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<IoTData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const dataRef = ref(db, "iot_server_monitor/current");
    onValue(dataRef, (snapshot) => {
      setData(snapshot.val());
      setLastUpdated(new Date());
    });
  }, []);

  const handleAck = async () => {
    const ackRef = ref(db, "iot_server_monitor/current");
    await update(ackRef, {
      ack: true,
    });
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading IoT Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 shadow-2xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🚀</span>
                IoT Server Monitor
              </h1>
              <p className="text-gray-400 mt-1">
                Advanced Environmental Monitoring System
              </p>
            </div>
            {lastUpdated && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-green-400">
                  {lastUpdated.toLocaleTimeString()}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gauges Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <CircularGauge
            value={data.temp_sensor_1}
            maxValue={50}
            minValue={0}
            title="Sensor 1 Temperature"
            unit="°C"
            color="#EF4444"
            size={240}
          />

          <CircularGauge
            value={data.temp_sensor_2}
            maxValue={50}
            minValue={0}
            title="Sensor 2 Temperature"
            unit="°C"
            color="#F59E0B"
            size={240}
          />

          <CircularGauge
            value={data.humidity}
            maxValue={100}
            minValue={0}
            title="Humidity Level"
            unit="%"
            color="#10B981"
            size={240}
          />
        </div>

        {/* Status Card */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 mb-8 hover:border-gray-600 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>⚡</span>
                System Diagnostics
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Real-time system health monitoring
              </p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge
                status={data.status === "NORMAL" ? "online" : "warning"}
              />
              <div className="text-right">
                <span className="text-lg font-semibold text-white">
                  {data.status}
                </span>
                <p className="text-xs text-gray-400">Operational Status</p>
              </div>
            </div>
          </div>

          {/* ACK Section */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Acknowledgement Status</p>
                <p className="text-xs text-gray-500">
                  ACK: {data.ack ? "✅ Acknowledged" : "⏳ Pending"}
                </p>
              </div>
              <button
                onClick={handleAck}
                disabled={data.ack}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  data.ack
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                }`}
              >
                {data.ack
                  ? "✅ Already Acknowledged"
                  : "✅ ACK – Sudah Ditangani"}
              </button>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 hover:border-gray-600 transition-colors duration-300">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span>📊</span>
              Temperature Analytics
            </h2>
            <p className="text-gray-400 text-sm">
              Historical temperature data visualization
            </p>
          </div>
          <TempChart temp1={data.temp_sensor_1} temp2={data.temp_sensor_2} />
        </div>
      </div>
    </div>
  );
}
