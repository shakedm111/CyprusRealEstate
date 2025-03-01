import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import CalculatorTable from "@/components/dashboard/CalculatorTable";
import { InvestmentSummaryChart } from "@/components/dashboard/InvestmentSummaryChart";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { Button } from "@/components/ui/button";
import { NewCalculatorModal } from "@/components/modals/NewCalculatorModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DashboardData = {
  stats: {
    activeCalculators: number;
    investorCount: number;
    propertyCount: number;
    exchangeRate: number;
  };
  recentCalculators: {
    id: number;
    name: string;
    investor: string;
    updatedAt: Date;
    status: string;
  }[];
  investmentSummary: {
    totalValue: number;
    averageYield: number;
    monthlyIncome: number;
    distribution: { name: string; percentage: number }[];
  };
  performanceData: {
    months: string[];
    apartments: number[];
    villas: number[];
  };
  recentActivity: {
    type: string;
    message: string;
    timestamp: Date;
  }[];
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [investmentPeriod, setInvestmentPeriod] = useState("lastMonth");
  const [performancePeriod, setPerformancePeriod] = useState("lastSixMonths");
  const [newCalculatorModalOpen, setNewCalculatorModalOpen] = useState(false);

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchOnWindowFocus: false,
  });

  // Format date for header
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return now.toLocaleDateString(t("language") === "he" ? "he-IL" : "en-US", options);
  };

  // Format date for calculator table
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t("language") === "he" ? "he-IL" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl text-red-500 font-bold">{t("common.error")}</h2>
            <p>{t("dashboard.dataError")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Transform data for components
  const calculators = data.recentCalculators.map((calc) => ({
    id: calc.id,
    name: calc.name,
    investor: calc.investor,
    updatedAt: formatDate(calc.updatedAt),
    status: calc.status as "active" | "draft" | "archived",
  }));

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dashboard Header Section */}
        <div className="lg:col-span-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t("common.welcomeMessage")}, {user?.name}
              </h2>
              <p className="text-gray-500 mt-1">{getCurrentDate()}</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3 space-x-reverse">
              <Button 
                onClick={() => setNewCalculatorModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm"
              >
                <i className="fas fa-plus mr-2"></i>
                <span>{t("common.newCalculator")}</span>
              </Button>
              <Button variant="outline" className="border border-gray-200 hover:bg-gray-50 text-gray-700">
                <i className="fas fa-download mr-2"></i>
                <span>{t("common.exportReport")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="calculator"
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
            title={t("common.activeCalculators")}
            value={data.stats.activeCalculators}
          />
          <StatCard
            icon="users"
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            title={t("common.activeInvestors")}
            value={data.stats.investorCount}
          />
          <StatCard
            icon="building"
            iconColor="text-blue-500"
            iconBgColor="bg-blue-100"
            title={t("common.propertiesInAnalysis")}
            value={data.stats.propertyCount}
          />
          <StatCard
            icon="euro-sign"
            iconColor="text-orange-500"
            iconBgColor="bg-orange-100"
            title={t("common.exchangeRate")}
            value={data.stats.exchangeRate}
            direction="ltr"
          />
        </div>

        {/* Recent Calculators Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">{t("common.recentCalculators")}</h3>
              <a href="/calculators" className="text-teal-500 hover:text-teal-600 text-sm">
                {t("common.viewAllCalculators")}
              </a>
            </div>
            <CalculatorTable calculators={calculators} />
          </div>
        </div>

        {/* Investment Summary Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">{t("common.investmentSummary")}</h3>
              <div className="text-sm text-gray-500">
                <Select value={investmentPeriod} onValueChange={setInvestmentPeriod}>
                  <SelectTrigger className="border-none bg-transparent focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastMonth">{t("common.thisMonth")}</SelectItem>
                    <SelectItem value="lastThreeMonths">{t("common.lastThreeMonths")}</SelectItem>
                    <SelectItem value="lastSixMonths">{t("common.lastSixMonths")}</SelectItem>
                    <SelectItem value="lastYear">{t("common.lastYear")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <InvestmentSummaryChart distribution={data.investmentSummary.distribution} />

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{t("common.totalActiveInvestments")}:</span>
                <span className="font-bold">€{data.investmentSummary.totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{t("common.averageYield")}:</span>
                <span className="font-bold text-green-600">{data.investmentSummary.averageYield}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("common.expectedMonthlyIncome")}:</span>
                <span className="font-bold">€{data.investmentSummary.monthlyIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">{t("common.investmentPerformance")}</h3>
              <div className="text-sm text-gray-500">
                <Select value={performancePeriod} onValueChange={setPerformancePeriod}>
                  <SelectTrigger className="border-none bg-transparent focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastSixMonths">{t("common.lastSixMonths")}</SelectItem>
                    <SelectItem value="lastYear">{t("common.lastYear")}</SelectItem>
                    <SelectItem value="lastThreeYears">3 {t("common.years")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PerformanceChart
              months={data.performanceData.months}
              apartments={data.performanceData.apartments}
              villas={data.performanceData.villas}
            />

            <div className="flex justify-center mt-4 space-x-6 space-x-reverse">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">{t("common.yieldFromApartments")}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">{t("common.yieldFromVillas")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t("common.recentActivity")}</h3>
            <ActivityLog activities={data.recentActivity} />
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <a href="#" className="text-teal-500 hover:text-teal-600 text-sm">
                {t("common.viewAllActivities")}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* New Calculator Modal */}
      <NewCalculatorModal
        isOpen={newCalculatorModalOpen}
        onClose={() => setNewCalculatorModalOpen(false)}
      />
    </AppLayout>
  );
}