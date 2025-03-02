import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Investor form schema
const investorSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().optional(),
  name: z.string().min(1, { message: "Name is required" }),
});

type InvestorFormValues = z.infer<typeof investorSchema>;

type Investor = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  name: string;
  role: "investor";
  status: "active" | "inactive";
  lastLogin: string | null;
  createdAt: string;
};

export default function Investors() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdvisor = user?.role === "advisor";
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [investorToDelete, setInvestorToDelete] = useState<number | null>(null);

  // Set up form
  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      phone: "",
      name: "",
    },
  });

  // Fetch investors (only available to advisors)
  const { data: investors, isLoading } = useQuery<Investor[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
    enabled: isAdvisor,
  });

  // Create investor mutation
  const createMutation = useMutation({
    mutationFn: async (data: InvestorFormValues) => {
      const res = await apiRequest("POST", "/api/users", {
        ...data,
        role: "investor",
        status: "active"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("investor.createSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("investor.createError"),
        variant: "destructive",
      });
      console.error("Error creating investor:", error);
    },
  });

  const onSubmit = async (data: InvestorFormValues) => {
    await createMutation.mutateAsync(data);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(t("language") === "he" ? "he-IL" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // If not an advisor, show access denied
  if (!isAdvisor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <i className="fas fa-lock text-4xl text-red-500 mb-4"></i>
            <h2 className="text-2xl font-bold mb-2">{t("common.accessDenied")}</h2>
            <p className="text-gray-600">{t("investor.advisorOnly")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{t("common.investors")}</h1>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <i className="fas fa-user-plus mr-2"></i>
            <span>{t("investor.createInvestor")}</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("investor.investorsList")}</CardTitle>
            <CardDescription>
              {t("investor.listDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full" />
              </div>
            ) : investors && investors.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("investor.investorName")}</TableHead>
                      <TableHead>{t("investor.email")}</TableHead>
                      <TableHead>{t("investor.phone")}</TableHead>
                      <TableHead>{t("investor.status")}</TableHead>
                      <TableHead>{t("investor.lastLogin")}</TableHead>
                      <TableHead>{t("investor.joinedDate")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investors
                      .filter(investor => investor.role === "investor")
                      .map((investor) => (
                        <TableRow key={investor.id}>
                          <TableCell>
                            <div className="font-medium">{investor.name}</div>
                            <div className="text-sm text-gray-500">{investor.username}</div>
                          </TableCell>
                          <TableCell>{investor.email}</TableCell>
                          <TableCell>{investor.phone || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                investor.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {investor.status === "active" 
                                ? t("common.active") 
                                : t("common.inactive")}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(investor.lastLogin)}</TableCell>
                          <TableCell>{formatDate(investor.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("investor.noInvestors")}</p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  {t("investor.createFirst")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Investor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("investor.createInvestor")}</DialogTitle>
            <DialogDescription>
              {t("investor.formDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("investor.investorName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("investor.enterName")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("investor.email")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder={t("investor.enterEmail")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("investor.phone")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("investor.enterPhone")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.username")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("investor.enterUsername")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.password")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={t("investor.enterPassword")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  type="button"
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-teal-500 hover:bg-teal-600"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t("common.creating")}
                    </div>
                  ) : (
                    t("common.create")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
