import { useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PerformanceChartProps = {
  months: string[];
  apartments: number[];
  villas: number[];
};

export const PerformanceChart = ({ months, apartments, villas }: PerformanceChartProps) => {
  const { t, isRtl } = useTranslation();

  // Combine the data for the chart
  const data = months.map((month, index) => ({
    name: month,
    apartments: apartments[index] || 0,
    villas: villas[index] || 0,
  }));

  // Customize the tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name === "apartments" ? t("common.yieldFromApartments") : t("common.yieldFromVillas")}
              : {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 'dataMax + 2']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="apartments"
            stroke="#3CBFB4"
            strokeWidth={3}
            dot={{ r: 4, fill: "#3CBFB4" }}
            activeDot={{ r: 6 }}
            name="apartments"
          />
          <Line
            type="monotone"
            dataKey="villas"
            stroke="#9333ea"
            strokeWidth={3}
            dot={{ r: 4, fill: "#9333ea" }}
            activeDot={{ r: 6 }}
            name="villas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
