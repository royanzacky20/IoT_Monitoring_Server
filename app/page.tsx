"use client";

import { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { Bricolage_Grotesque } from "next/font/google";
import { db } from "@/lib/firebase";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

interface IoTData {
  temp_sensor_1: number;
  temp_sensor_2: number;
  humidity: number;
  status: string;
  ack?: boolean;
}

interface Point {
  t1: number;
  t2: number;
}

const INK = "#14121F";
const VIOLET = "#6C4CFF";
const CORAL = "#FF6B6B";
const YELLOW = "#FFD84D";
const MINT = "#3DDBA4";

const card =
  "rounded-[28px] border-[3px] border-[#14121F] shadow-[6px_6px_0_0_#14121F] p-5 sm:p-6";

/* ---------- Segment meter: pengganti gauge melingkar ---------- */
function SegmentMeter({
  value,
  min,
  max,
  fill,
  empty = "#FFFFFF",
}: {
  value: number;
  min: number;
  max: number;
  fill: string;
  empty?: string;
}) {
  const total = 20;
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const filled = Math.round(ratio * total);
  return (
    <div
      className="flex gap-1"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-9 flex-1 rounded-md border-2 border-[#14121F] transition-colors duration-300"
          style={{ background: i < filled ? fill : empty }}
        />
      ))}
    </div>
  );
}

/* ---------- Grafik tren dua sensor ---------- */
function TrendChart({ history }: { history: Point[] }) {
  if (history.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-[#14121F]/40 text-sm font-semibold">
        Menunggu data berikutnya buat gambar grafik…
      </div>
    );
  }

  const W = 600;
  const H = 220;
  const P = 28;
  const all = history.flatMap((h) => [h.t1, h.t2]);
  const min = Math.floor(Math.min(...all) - 1);
  const max = Math.ceil(Math.max(...all) + 1);
  const n = history.length;
  const x = (i: number) => P + (i * (W - 2 * P)) / (n - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
  const line = (key: "t1" | "t2") =>
    history.map((h, i) => `${x(i)},${y(h[key])}`).join(" ");
  const ticks = [min, (min + max) / 2, max];
  const last = history[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Grafik suhu sensor 1 dan sensor 2"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={P}
            x2={W - P}
            y1={y(t)}
            y2={y(t)}
            stroke={INK}
            strokeOpacity="0.15"
            strokeDasharray="4 6"
          />
          <text x={0} y={y(t) + 4} fontSize="11" fill={INK} fillOpacity="0.6">
            {t.toFixed(0)}°
          </text>
        </g>
      ))}
      <polyline
        points={line("t1")}
        fill="none"
        stroke={VIOLET}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={line("t2")}
        fill="none"
        stroke={CORAL}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={x(n - 1)}
        cy={y(last.t1)}
        r="7"
        fill={VIOLET}
        stroke={INK}
        strokeWidth="3"
      />
      <circle
        cx={x(n - 1)}
        cy={y(last.t2)}
        r="7"
        fill={CORAL}
        stroke={INK}
        strokeWidth="3"
      />
    </svg>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<IoTData | null>(null);
  const [history, setHistory] = useState<Point[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const dataRef = ref(db, "iot_server_monitor/current");
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const val = snapshot.val() as IoTData | null;
      setData(val);
      setLastUpdated(new Date());
      if (val) {
        setHistory((prev) =>
          [...prev, { t1: val.temp_sensor_1, t2: val.temp_sensor_2 }].slice(
            -40,
          ),
        );
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAck = async () => {
    try {
      setIsUpdating(true);
      await update(ref(db, "iot_server_monitor/current"), { ack: true });
    } catch (error) {
      console.error("Failed to set ACK:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!data) {
    return (
      <div
        className={`${display.className} flex min-h-screen flex-col items-center justify-center gap-5 bg-[#EEF0FF] p-4 text-[#14121F]`}
      >
        <div className="flex gap-2">
          {[VIOLET, CORAL, YELLOW].map((c, i) => (
            <span
              key={c}
              className="h-5 w-5 rounded-full border-[3px] border-[#14121F] motion-safe:animate-bounce"
              style={{ background: c, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
        <p className="text-lg font-semibold">Lagi nyambung ke server…</p>
      </div>
    );
  }

  const isNormal = data.status === "NORMAL";

  return (
    <div
      className={`${display.className} min-h-screen bg-[#EEF0FF] pb-12 text-[#14121F] selection:bg-[#FFD84D]`}
    >
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6 sm:px-6 sm:pt-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl border-[3px] border-[#14121F] text-2xl shadow-[3px_3px_0_0_#14121F]"
              style={{ background: YELLOW }}
              aria-hidden
            >
              🛡️
            </div>
            <div>
              <h1 className="text-3xl font-extrabold leading-none tracking-tight">
                BeepGuard
              </h1>
              <p className="mt-1 text-sm font-semibold opacity-60">
                Pantau suhu & kelembapan ruang server
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border-[3px] border-[#14121F] bg-white px-3.5 py-1.5 text-sm font-bold shadow-[3px_3px_0_0_#14121F]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#3DDBA4] opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#3DDBA4]" />
              </span>
              Live
            </div>
            {lastUpdated && (
              <p className="text-sm font-semibold opacity-60">
                Sinkron {lastUpdated.toLocaleTimeString("id-ID")}
              </p>
            )}
          </div>
        </header>

        {/* Bento grid */}
        <main className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Hero: status */}
          <section
            className={`${card} md:col-span-4`}
            style={{ background: isNormal ? MINT : CORAL }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full border-2 border-[#14121F] bg-white px-3 py-1 text-sm font-bold">
                  Status: {data.status}
                </span>
                <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                  {isNormal
                    ? "Semua aman,\nsantai aja."
                    : "Ada yang\ngak beres!"}
                </h2>
              </div>
              <span
                className={`select-none text-6xl sm:text-8xl ${
                  isNormal ? "" : "motion-safe:animate-pulse"
                }`}
                aria-hidden
              >
                {isNormal ? "😎" : "🥵"}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border-[3px] border-[#14121F] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#14121F] ${
                    data.ack
                      ? "bg-[#3DDBA4]"
                      : "bg-[#FFD84D] motion-safe:animate-pulse"
                  }`}
                />
                <p className="text-sm font-bold">
                  {data.ack
                    ? "Sudah ditangani teknisi"
                    : "Belum ada yang menangani insiden ini"}
                </p>
              </div>
              <button
                onClick={handleAck}
                disabled={data.ack || isUpdating}
                className="rounded-xl border-[3px] border-[#14121F] px-5 py-2.5 text-sm font-extrabold shadow-[4px_4px_0_0_#14121F] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#14121F] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#6C4CFF] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                style={{ background: data.ack ? undefined : YELLOW }}
              >
                {data.ack
                  ? "✅ Sudah ditangani"
                  : isUpdating
                    ? "Mengirim…"
                    : "🚨 Aku tangani sekarang"}
              </button>
            </div>
          </section>

          {/* Humidity */}
          <section
            className={`${card} flex flex-col justify-between gap-6 text-white md:col-span-2`}
            style={{ background: VIOLET }}
          >
            <div>
              <p className="text-sm font-bold opacity-80">Kelembapan</p>
              <p className="mt-2 text-7xl font-extrabold leading-none tracking-tight">
                {data.humidity.toFixed(0)}
                <span className="text-3xl">%</span>
              </p>
            </div>
            <SegmentMeter
              value={data.humidity}
              min={0}
              max={100}
              fill={MINT}
              empty="#ffffff33"
            />
          </section>

          {/* Sensor 1 */}
          <section className={`${card} bg-white md:col-span-3`}>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold opacity-70">Sensor 1</p>
              <p className="text-5xl font-extrabold tracking-tight">
                {data.temp_sensor_1.toFixed(1)}
                <span className="text-2xl">°C</span>
              </p>
            </div>
            <div className="mt-5">
              <SegmentMeter
                value={data.temp_sensor_1}
                min={0}
                max={50}
                fill={VIOLET}
              />
              <div className="mt-2 flex justify-between text-xs font-bold opacity-60">
                <span>0°</span>
                <span>50°</span>
              </div>
            </div>
          </section>

          {/* Sensor 2 */}
          <section
            className={`${card} md:col-span-3`}
            style={{ background: YELLOW }}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold opacity-70">Sensor 2</p>
              <p className="text-5xl font-extrabold tracking-tight">
                {data.temp_sensor_2.toFixed(1)}
                <span className="text-2xl">°C</span>
              </p>
            </div>
            <div className="mt-5">
              <SegmentMeter
                value={data.temp_sensor_2}
                min={0}
                max={50}
                fill={CORAL}
              />
              <div className="mt-2 flex justify-between text-xs font-bold opacity-60">
                <span>0°</span>
                <span>50°</span>
              </div>
            </div>
          </section>

          {/* Chart */}
          <section className={`${card} bg-white md:col-span-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">Tren suhu</h2>
              <div className="flex gap-4 text-sm font-bold">
                <span className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full border-2 border-[#14121F]"
                    style={{ background: VIOLET }}
                  />
                  Sensor 1
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full border-2 border-[#14121F]"
                    style={{ background: CORAL }}
                  />
                  Sensor 2
                </span>
              </div>
            </div>
            <TrendChart history={history} />
          </section>
        </main>
      </div>
    </div>
  );
}
