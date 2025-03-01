import { ReactNode } from "react";

type StatCardProps = {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: string | number;
  direction?: "ltr" | "rtl";
};

export const StatCard = ({ icon, iconColor, iconBgColor, title, value, direction }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
      <div className={`rounded-full p-3 mr-4 ${iconBgColor}`}>
        <i className={`fas fa-${icon} ${iconColor} text-xl`}></i>
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className={`text-2xl font-bold text-gray-800 ${direction === "ltr" ? "ltr" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
