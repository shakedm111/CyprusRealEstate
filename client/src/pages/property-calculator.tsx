import { useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import PropertyPriceCalculator from "@/components/calculators/PropertyPriceCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

export default function PropertyCalculator() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // בדיקה שהמשתמש מחובר
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/calculators")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("common.back")}</span>
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">{t("property.calculator")}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("property.calculatorTitle")}</CardTitle>
            <CardDescription>
              {t("property.calculatorDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="propertyPrice" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="propertyPrice">{t("property.priceCalculator")}</TabsTrigger>
                <TabsTrigger value="mortgage">{t("property.mortgageCalculator")}</TabsTrigger>
                <TabsTrigger value="cashFlow">{t("property.cashFlowCalculator")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="propertyPrice">
                <PropertyPriceCalculator />
              </TabsContent>
              
              <TabsContent value="mortgage">
                <div className="flex items-center justify-center h-64 border rounded-md bg-gray-50">
                  <p className="text-gray-500">{t("common.comingSoon")}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="cashFlow">
                <div className="flex items-center justify-center h-64 border rounded-md bg-gray-50">
                  <p className="text-gray-500">{t("common.comingSoon")}</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}