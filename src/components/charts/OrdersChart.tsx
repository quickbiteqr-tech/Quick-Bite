"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const BRAND = "#6DBE45";
const AXIS = "#94a3b8";
const GRID = "#e2e8f0";

type ChartData = {
  name: string;
  orders?: number;
  revenue?: number;
};

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
};

export default function OrdersChart({ data }: { data: ChartData[] }) {
  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} />
          <YAxis
            allowDecimals={false}
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={{ stroke: GRID }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            formatter={(value: number | string) => [value, "Orders"]}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke={BRAND}
            strokeWidth={2.5}
            dot={{ fill: BRAND, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: BRAND }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            formatter={(value: number | string) => [
              typeof value === "number"
                ? new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(value)
                : value,
              "Revenue",
            ]}
          />
          <Bar dataKey="revenue" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
