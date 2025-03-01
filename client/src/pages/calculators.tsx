import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { NewCalculatorModal } from "@/components/modals/NewCalculatorModal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Calculator = {
  id: number;
  name: string;
  userId: number;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  investor?: {
    name: string;
  };
};

export default function Calculators() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCalculatorModalOpen, setNewCalculatorModalOpen] = useState(false);
  const [calculatorToDelete, setCalculatorToDelete] = useState<number | null>(null);
  const [calculatorToEdit, setCalculatorToEdit] = useState<number | null>(null);

  // Fetch calculators
  const { data: calculators, isLoading } = useQuery<Calculator[]>({
    queryKey: ["/api/calculators"],
    refetchOnWindowFocus: false,
  });

  // Delete calculator mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/calculators/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("calculator.deleteSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("calculator.deleteError"),
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (calculatorToDelete) {
      await deleteMutation.mutateAsync(calculatorToDelete);
      setCalculatorToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    setCalculatorToEdit(id);
    setNewCalculatorModalOpen(true);
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t("language") === "he" ? "he-IL" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{t("common.calculators")}</h1>
          <Button
            onClick={() => {
              setCalculatorToEdit(null);
              setNewCalculatorModalOpen(true);
            }}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <i className="fas fa-plus mr-2"></i>
            <span>{t("common.newCalculator")}</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("calculator.list")}</CardTitle>
            <CardDescription>
              {t("calculator.listDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full" />
              </div>
            ) : calculators && calculators.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.calculatorName")}</TableHead>
                      <TableHead>{t("common.investor")}</TableHead>
                      <TableHead>{t("common.created")}</TableHead>
                      <TableHead>{t("common.updated")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculators.map((calculator) => (
                      <TableRow key={calculator.id}>
                        <TableCell>
                          <div className="font-medium">{calculator.name}</div>
                        </TableCell>
                        <TableCell>
                          {calculator.investor?.name || t("calculator.noInvestor")}
                        </TableCell>
                        <TableCell>{formatDate(calculator.createdAt)}</TableCell>
                        <TableCell>{formatDate(calculator.updatedAt)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(
                              calculator.status
                            )}`}
                          >
                            {t(`common.${calculator.status}`)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <i className="fas fa-ellipsis-v"></i>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(calculator.id)}
                              >
                                <i className="fas fa-edit mr-2"></i>
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onClick={() => setCalculatorToDelete(calculator.id)}
                                    className="text-red-600"
                                  >
                                    <i className="fas fa-trash mr-2"></i>
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("calculator.confirmDelete")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("calculator.deleteWarning")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("common.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDelete}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {t("common.delete")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("calculator.noCalculators")}</p>
                <Button
                  onClick={() => setNewCalculatorModalOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <i className="fas fa-plus mr-2"></i>
                  {t("calculator.createFirst")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewCalculatorModal
        isOpen={newCalculatorModalOpen}
        onClose={() => setNewCalculatorModalOpen(false)}
        calculatorId={calculatorToEdit}
      />
    </AppLayout>
  );
}
