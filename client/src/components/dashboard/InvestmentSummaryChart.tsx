import { useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";

type DistributionItem = {
  name: string;
  percentage: number;
};

type InvestmentSummaryChartProps = {
  distribution: DistributionItem[];
};

export const InvestmentSummaryChart = ({ distribution }: InvestmentSummaryChartProps) => {
  const { t, isRtl } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);

  // Function to generate pie chart CSS
  const generateConicGradient = (items: DistributionItem[]) => {
    let gradientString = "";
    let currentPercentage = 0;

    items.forEach((item, index) => {
      const startPercentage = currentPercentage;
      currentPercentage += item.percentage;
      
      const colors = [
        "#3CBFB4", // teal
        "#9333ea", // purple
        "#3b82f6", // blue
        "#f97316", // orange
        "#10b981", // green
      ];
      
      const color = colors[index % colors.length];
      
      if (index === 0) {
        gradientString += `${color} 0% ${currentPercentage}%`;
      } else {
        gradientString += `, ${color} ${startPercentage}% ${currentPercentage}%`;
      }
    });
    
    return `conic-gradient(${gradientString})`;
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.style.background = generateConicGradient(distribution);
    }
  }, [distribution]);

  const getColor = (index: number) => {
    const colors = [
      "bg-teal-500", // teal
      "bg-purple-600", // purple
      "bg-blue-500", // blue
      "bg-orange-500", // orange
      "bg-green-500", // green
    ];
    
    return colors[index % colors.length];
  };

  return (
    <div className="chart-container">
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full">
          {/* Pie chart created with CSS */}
          <div className="mx-auto w-40 h-40 rounded-full relative">
            <div
              ref={chartRef}
              className="absolute inset-0 rounded-full overflow-hidden"
            ></div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center m-10 bg-white"></div>
          </div>
          
          <div className="mt-8 space-y-3">
            {distribution.map((item, index) => (
              <div key={item.name} className="flex items-center">
                <div className={`w-4 h-4 ${getColor(index)} rounded-sm mr-2`}></div>
                <div className="text-sm text-gray-600 flex-1">{item.name}</div>
                <div className="text-sm font-medium">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummaryChart;
