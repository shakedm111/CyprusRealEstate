import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";

// סכמת הטופס
const formSchema = z.object({
  propertyName: z.string().min(1, { message: "נדרש שם נכס" }),
  priceWithoutVAT: z.coerce
    .number()
    .min(1, { message: "יש להזין מחיר חיובי" }),
  vatRate: z.coerce
    .number()
    .min(0, { message: "מע\"מ לא יכול להיות שלילי" })
    .max(100, { message: "מע\"מ לא יכול להיות מעל 100%" }),
  bedroomCount: z.coerce
    .number()
    .min(0, { message: "מספר חדרי שינה לא יכול להיות שלילי" })
    .max(10, { message: "מספר חדרי שינה גדול מדי" }),
  hasFurniture: z.boolean().default(false),
  hasRealEstateAgent: z.boolean().default(true),
  expectedMonthlyRent: z.coerce
    .number()
    .min(0, { message: "שכירות חודשית לא יכולה להיות שלילית" }),
  guaranteedRent: z.coerce
    .number()
    .min(0, { message: "שכירות מובטחת לא יכולה להיות שלילית" })
    .optional(),
  hasPropertyManagement: z.boolean().default(true),
  propertyManagementPercentage: z.coerce
    .number()
    .min(0, { message: "אחוז דמי ניהול לא יכול להיות שלילי" })
    .max(100, { message: "אחוז דמי ניהול לא יכול להיות מעל 100%" })
    .default(8),
});

type FormValues = z.infer<typeof formSchema>;

// המרכיב הראשי למחשבון מחיר נכס
export default function PropertyPriceCalculator() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("input");
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(3.9);

  // קבלת שער החליפין מהשרת
  const { data: systemSettings } = useQuery({
    queryKey: ["/api/system-settings"],
  });

  useEffect(() => {
    if (systemSettings) {
      const exchangeRateSetting = systemSettings.find((setting: any) => setting.key === "exchange_rate");
      if (exchangeRateSetting) {
        setExchangeRate(parseFloat(exchangeRateSetting.value));
      }
    }
  }, [systemSettings]);

  // הגדרת הטופס
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyName: "",
      priceWithoutVAT: 0,
      vatRate: 19,
      bedroomCount: 2,
      hasFurniture: false,
      hasRealEstateAgent: true,
      expectedMonthlyRent: 0,
      guaranteedRent: 0,
      hasPropertyManagement: true,
      propertyManagementPercentage: 8,
    },
  });

  // עיבוד הטופס והצגת החישובים
  const onSubmit = async (values: FormValues) => {
    try {
      // חישוב מחיר עם מע"מ
      const priceWithVAT = values.priceWithoutVAT * (1 + values.vatRate / 100);
      
      // חישוב מס רכישה
      let stampDuty = 0;
      
      if (values.priceWithoutVAT <= 85000) {
        stampDuty = values.priceWithoutVAT * 0.03;
      } else if (values.priceWithoutVAT <= 170000) {
        stampDuty = 85000 * 0.03 + (values.priceWithoutVAT - 85000) * 0.05;
      } else {
        stampDuty = 85000 * 0.03 + 85000 * 0.05 + (values.priceWithoutVAT - 170000) * 0.08;
      }
      
      // חישוב עלות ריהוט
      let furnitureCost = 0;
      if (!values.hasFurniture) {
        switch (values.bedroomCount) {
          case 0: furnitureCost = 5000; break;
          case 1: furnitureCost = 8000; break;
          case 2: furnitureCost = 12000; break;
          case 3: furnitureCost = 16000; break;
          case 4: furnitureCost = 22000; break;
          default: furnitureCost = 25000 + (values.bedroomCount - 5) * 5000;
        }
      }
      
      // חישוב עלויות נלוות
      const legalFees = values.priceWithoutVAT * 0.01;
      const agentFees = values.hasRealEstateAgent ? values.priceWithoutVAT * 0.03 : 0;
      const landRegistryFees = values.priceWithoutVAT * 0.005;
      const bankFees = 1000;
      const otherFees = 500;
      
      const acquisitionCosts = {
        legalFees,
        agentFees,
        landRegistryFees,
        bankFees,
        otherFees,
        total: legalFees + agentFees + landRegistryFees + bankFees + otherFees
      };
      
      // חישוב סה"כ עלות רכישה
      const totalCost = priceWithVAT + stampDuty + furnitureCost + acquisitionCosts.total;
      
      // חישוב תשואה פוטנציאלית
      const annualRent = values.expectedMonthlyRent * 12;
      const potentialYield = (annualRent / totalCost) * 100;
      
      // חישוב תשואה מובטחת, אם יש
      let guaranteedYield = 0;
      if (values.guaranteedRent && values.guaranteedRent > 0) {
        const annualGuaranteedRent = values.guaranteedRent * 12;
        guaranteedYield = (annualGuaranteedRent / totalCost) * 100;
      }
      
      // חישוב הוצאות תפעוליות
      const managementFees = values.hasPropertyManagement 
        ? (values.expectedMonthlyRent * values.propertyManagementPercentage / 100) 
        : 0;
      const operatingExpenses = managementFees;
      
      // חישוב תזרים מזומנים חודשי (ללא משכנתא)
      const monthlyCashFlow = values.expectedMonthlyRent - operatingExpenses;
      
      // תוצאת החישוב המלאה
      const result = {
        propertyName: values.propertyName,
        // מחירים ועלויות
        priceWithoutVAT: values.priceWithoutVAT,
        priceWithVAT,
        vatAmount: priceWithVAT - values.priceWithoutVAT,
        stampDuty,
        furnitureCost,
        acquisitionCosts,
        totalCost,
        
        // המרה לשקלים
        totalCostILS: totalCost * exchangeRate,
        
        // הכנסות ותשואות
        monthlyRent: values.expectedMonthlyRent,
        annualRent,
        potentialYield: parseFloat(potentialYield.toFixed(2)),
        
        guaranteedRent: values.guaranteedRent || 0,
        guaranteedYield: parseFloat(guaranteedYield.toFixed(2)),
        
        // הוצאות תפעוליות
        managementFees,
        operatingExpenses,
        
        // תזרים מזומנים
        monthlyCashFlow,
        annualCashFlow: monthlyCashFlow * 12,
        
        // נתונים נוספים
        bedroomCount: values.bedroomCount,
        hasFurniture: values.hasFurniture,
        hasRealEstateAgent: values.hasRealEstateAgent,
        hasPropertyManagement: values.hasPropertyManagement,
      };
      
      // שמירת תוצאת החישוב והצגת לשונית התוצאות
      setCalculationResult(result);
      setActiveTab("results");
      
    } catch (error) {
      console.error("Error calculating property price:", error);
    }
  };

  // רכיב טיפ עם הסבר
  const InfoTooltip = ({ text }: { text: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
            <HelpCircle className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm text-sm">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // פורמט מספר כמטבע
  const formatCurrency = (value: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: currency === "EUR" ? "EUR" : "ILS",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{t("property.priceCalculator")}</CardTitle>
        <CardDescription>
          {t("property.priceCalculatorDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="input">{t("common.inputData")}</TabsTrigger>
            <TabsTrigger value="results">{t("common.results")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex">
                        {t("property.propertyName")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="priceWithoutVAT"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex">
                          {t("property.priceWithoutVAT")}
                          <InfoTooltip text={t("property.priceWithoutVATInfo")} />
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} type="number" min="0" step="1000" />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              €
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex">
                          {t("property.vatRate")}
                          <InfoTooltip text={t("property.vatRateInfo")} />
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} type="number" min="0" max="100" step="0.1" />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              %
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bedroomCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex">
                          {t("property.bedroomCount")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" max="10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hasFurniture"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t("property.hasFurniture")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="expectedMonthlyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex">
                          {t("property.expectedMonthlyRent")}
                          <InfoTooltip text={t("property.expectedMonthlyRentInfo")} />
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} type="number" min="0" step="50" />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              €
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="guaranteedRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex">
                          {t("property.guaranteedRent")}
                          <InfoTooltip text={t("property.guaranteedRentInfo")} />
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} type="number" min="0" step="50" />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              €
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="hasRealEstateAgent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t("property.hasRealEstateAgent")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hasPropertyManagement"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t("property.hasPropertyManagement")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("hasPropertyManagement") && (
                  <FormField
                    control={form.control}
                    name="propertyManagementPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex">
                          {t("property.propertyManagementPercentage")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} type="number" min="0" max="100" step="0.5" />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              %
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <Button type="submit" className="w-full">
                  {t("common.calculate")}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="results">
            {!calculationResult ? (
              <div className="text-center py-6">
                <p>{t("property.noCalculationYet")}</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("input")}
                  className="mt-4"
                >
                  {t("property.startCalculation")}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-xl font-bold border-b pb-2 text-center">
                  {calculationResult.propertyName || t("property.calculationResults")}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("property.acquisitionCosts")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between py-1">
                        <span>{t("property.priceWithoutVAT")}</span>
                        <span className="font-semibold">{formatCurrency(calculationResult.priceWithoutVAT)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>{t("property.vatAmount")}</span>
                        <span>{formatCurrency(calculationResult.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>{t("property.priceWithVAT")}</span>
                        <span className="font-semibold">{formatCurrency(calculationResult.priceWithVAT)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span>{t("property.stampDuty")}</span>
                        <span>{formatCurrency(calculationResult.stampDuty)}</span>
                      </div>
                      {calculationResult.furnitureCost > 0 && (
                        <div className="flex justify-between py-1">
                          <span>{t("property.furnitureCost")}</span>
                          <span>{formatCurrency(calculationResult.furnitureCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span>{t("property.legalFees")}</span>
                        <span>{formatCurrency(calculationResult.acquisitionCosts.legalFees)}</span>
                      </div>
                      {calculationResult.acquisitionCosts.agentFees > 0 && (
                        <div className="flex justify-between py-1">
                          <span>{t("property.agentFees")}</span>
                          <span>{formatCurrency(calculationResult.acquisitionCosts.agentFees)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span>{t("property.landRegistryFees")}</span>
                        <span>{formatCurrency(calculationResult.acquisitionCosts.landRegistryFees)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>{t("property.bankFees")}</span>
                        <span>{formatCurrency(calculationResult.acquisitionCosts.bankFees)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>{t("property.otherFees")}</span>
                        <span>{formatCurrency(calculationResult.acquisitionCosts.otherFees)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1 font-bold">
                        <span>{t("property.totalCost")}</span>
                        <span>{formatCurrency(calculationResult.totalCost)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-sm">
                        <span>{t("property.totalCostILS")}</span>
                        <span>{formatCurrency(calculationResult.totalCostILS, "ILS")}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("property.rentalYield")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between py-1">
                        <span>{t("property.monthlyRent")}</span>
                        <span className="font-semibold">{formatCurrency(calculationResult.monthlyRent)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>{t("property.annualRent")}</span>
                        <span>{formatCurrency(calculationResult.annualRent)}</span>
                      </div>
                      
                      {calculationResult.hasPropertyManagement && (
                        <div className="flex justify-between py-1">
                          <span>{t("property.managementFees")}</span>
                          <span className="text-red-500">-{formatCurrency(calculationResult.managementFees)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between py-1">
                        <span>{t("property.operatingExpenses")}</span>
                        <span className="text-red-500">-{formatCurrency(calculationResult.operatingExpenses)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between py-1">
                        <span>{t("property.monthlyCashFlow")}</span>
                        <span className={calculationResult.monthlyCashFlow >= 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                          {formatCurrency(calculationResult.monthlyCashFlow)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-1">
                        <span>{t("property.annualCashFlow")}</span>
                        <span className={calculationResult.annualCashFlow >= 0 ? "text-green-500" : "text-red-500"}>
                          {formatCurrency(calculationResult.annualCashFlow)}
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between py-1 font-bold">
                        <span>{t("property.potentialYield")}</span>
                        <span className="text-xl">{calculationResult.potentialYield.toFixed(2)}%</span>
                      </div>
                      
                      {calculationResult.guaranteedRent > 0 && (
                        <div className="flex justify-between py-1 font-bold">
                          <span>{t("property.guaranteedYield")}</span>
                          <span>{calculationResult.guaranteedYield.toFixed(2)}%</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("input")}>
                    {t("common.editCalculation")}
                  </Button>
                  
                  <Button onClick={() => { /* TODO: Save property functionality */ }}>
                    {t("common.saveProperty")}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}