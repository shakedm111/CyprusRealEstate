import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for investor
type Investor = {
  id: number;
  name: string;
};

// Type for calculator
type Calculator = {
  id: number;
  name: string;
  userId: number;
  selfEquity: number;
  hasMortgage: boolean;
  hasPropertyInIsrael: boolean;
  clientPreference: string;
  exchangeRate: number;
  vatRate: number;
  status: string;
};

// Form validation schema
const calculatorSchema = z.object({
  name: z.string().min(1, { message: "Calculator name is required" }),
  userId: z.coerce.number().min(1, { message: "Investor is required" }),
  selfEquity: z.coerce.number().positive({ message: "Self equity must be positive" }),
  hasMortgage: z.boolean(),
  hasPropertyInIsrael: z.boolean(),
  clientPreference: z.enum(["positive_cash_flow", "low_interest", "high_yield"]),
  exchangeRate: z.coerce.number().positive({ message: "Exchange rate must be positive" }),
  vatRate: z.coerce.number().positive({ message: "VAT rate must be positive" }),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

type NewCalculatorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  calculatorId?: number | null;
};

export const NewCalculatorModal = ({ isOpen, onClose, calculatorId }: NewCalculatorModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!calculatorId;

  // Fetch investors for dropdown
  const { data: investors } = useQuery<Investor[]>({
    queryKey: ["/api/users"],
    enabled: isOpen,
    refetchOnWindowFocus: false,
  });

  // Fetch system settings
  const { data: systemSettings } = useQuery<{ key: string; value: string }[]>({
    queryKey: ["/api/system-settings"],
    enabled: isOpen,
    refetchOnWindowFocus: false,
  });

  // Fetch calculator if editing
  const { data: calculator, isLoading: isLoadingCalculator } = useQuery<Calculator>({
    queryKey: [`/api/calculators/${calculatorId}`],
    enabled: isOpen && isEditing,
    refetchOnWindowFocus: false,
  });

  // Form setup
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      name: "",
      userId: 0,
      selfEquity: 0,
      hasMortgage: false,
      hasPropertyInIsrael: false,
      clientPreference: "positive_cash_flow",
      exchangeRate: 3.95,
      vatRate: 19,
      status: "draft",
    },
  });

  // Update form when calculator data is loaded
  useEffect(() => {
    if (calculator) {
      form.reset({
        name: calculator.name,
        userId: calculator.userId,
        selfEquity: calculator.selfEquity,
        hasMortgage: calculator.hasMortgage,
        hasPropertyInIsrael: calculator.hasPropertyInIsrael,
        clientPreference: calculator.clientPreference as any,
        exchangeRate: calculator.exchangeRate,
        vatRate: calculator.vatRate,
        status: calculator.status as any,
      });
    } else if (systemSettings) {
      // Set default values from system settings
      const exchangeRate = systemSettings.find(s => s.key === "exchange_rate");
      const vatRate = systemSettings.find(s => s.key === "vat_rate");
      
      form.setValue("exchangeRate", exchangeRate ? parseFloat(exchangeRate.value) : 3.95);
      form.setValue("vatRate", vatRate ? parseFloat(vatRate.value) : 19);
    }
  }, [calculator, systemSettings, form]);

  // Create calculator mutation
  const createMutation = useMutation({
    mutationFn: async (data: CalculatorFormValues) => {
      const res = await apiRequest("POST", "/api/calculators", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("calculator.createSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onClose();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("calculator.createError"),
        variant: "destructive",
      });
    },
  });

  // Update calculator mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CalculatorFormValues }) => {
      const res = await apiRequest("PUT", `/api/calculators/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("calculator.updateSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onClose();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("calculator.updateError"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CalculatorFormValues) => {
    if (isEditing && calculatorId) {
      await updateMutation.mutateAsync({ id: calculatorId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("calculator.editCalculator") : t("calculator.create")}
          </DialogTitle>
          <DialogDescription>
            {t("calculator.formDescription")}
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingCalculator ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-8 h-8 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("calculator.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("calculator.enterName")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("calculator.investor")}</FormLabel>
                    <Select 
                      value={field.value.toString()} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("calculator.selectInvestor")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {investors?.filter(investor => investor.role === "investor").map((investor) => (
                          <SelectItem key={investor.id} value={investor.id.toString()}>
                            {investor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="selfEquity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("calculator.selfEquity")}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t("calculator.enterAmount")} {...field} />
                    </FormControl>
                    <FormDescription>ILS</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hasMortgage"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t("calculator.hasMortgage")}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "yes")}
                          defaultValue={field.value ? "yes" : "no"}
                          className="flex space-x-4 space-x-reverse"
                        >
                          <FormItem className="flex items-center space-x-2 space-x-reverse">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t("common.yes")}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-x-reverse">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t("common.no")}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hasPropertyInIsrael"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t("calculator.hasPropertyInIsrael")}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "yes")}
                          defaultValue={field.value ? "yes" : "no"}
                          className="flex space-x-4 space-x-reverse"
                        >
                          <FormItem className="flex items-center space-x-2 space-x-reverse">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t("common.yes")}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-x-reverse">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t("common.no")}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="clientPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("calculator.financingPreference")}</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormItem 
                        className={`border rounded-md p-3 flex items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors ${field.value === "positive_cash_flow" ? "border-teal-500 bg-teal-50" : ""}`}
                        onClick={() => form.setValue("clientPreference", "positive_cash_flow")}
                      >
                        <FormControl>
                          <input 
                            type="radio" 
                            className="sr-only" 
                            {...field}
                            value="positive_cash_flow"
                            checked={field.value === "positive_cash_flow"}
                          />
                        </FormControl>
                        <div>
                          <i className="fas fa-coins text-yellow-500 mb-2 text-xl"></i>
                          <div className="text-sm">{t("calculator.positiveCashFlow")}</div>
                        </div>
                      </FormItem>
                      
                      <FormItem 
                        className={`border rounded-md p-3 flex items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors ${field.value === "low_interest" ? "border-teal-500 bg-teal-50" : ""}`}
                        onClick={() => form.setValue("clientPreference", "low_interest")}
                      >
                        <FormControl>
                          <input 
                            type="radio" 
                            className="sr-only" 
                            {...field}
                            value="low_interest"
                            checked={field.value === "low_interest"}
                          />
                        </FormControl>
                        <div>
                          <i className="fas fa-percentage text-blue-500 mb-2 text-xl"></i>
                          <div className="text-sm">{t("calculator.lowInterest")}</div>
                        </div>
                      </FormItem>
                      
                      <FormItem 
                        className={`border rounded-md p-3 flex items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors ${field.value === "high_yield" ? "border-teal-500 bg-teal-50" : ""}`}
                        onClick={() => form.setValue("clientPreference", "high_yield")}
                      >
                        <FormControl>
                          <input 
                            type="radio" 
                            className="sr-only" 
                            {...field}
                            value="high_yield"
                            checked={field.value === "high_yield"}
                          />
                        </FormControl>
                        <div>
                          <i className="fas fa-chart-line text-green-500 mb-2 text-xl"></i>
                          <div className="text-sm">{t("calculator.highYield")}</div>
                        </div>
                      </FormItem>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.exchangeRate")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>ILS/EUR</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("calculator.vatRate")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.status")}</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={(value: any) => field.onChange(value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("common.status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{t("common.draft")}</SelectItem>
                          <SelectItem value="active">{t("common.active")}</SelectItem>
                          <SelectItem value="archived">{t("common.archived")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t("common.saving")}
                    </div>
                  ) : (
                    isEditing ? t("common.save") : t("calculator.createCalculator")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewCalculatorModal;
