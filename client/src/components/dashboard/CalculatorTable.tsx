import { useTranslation } from "@/hooks/useTranslation";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Calculator = {
  id: number;
  name: string;
  investor: string;
  updatedAt: string;
  status: "active" | "draft" | "archived";
};

type CalculatorTableProps = {
  calculators: Calculator[];
  onEdit?: (id: number) => void;
};

export const CalculatorTable = ({ calculators, onEdit }: CalculatorTableProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatorToDelete, setCalculatorToDelete] = useState<number | null>(null);

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t("common.active");
      case "draft":
        return t("common.draft");
      case "archived":
        return t("common.archived");
      default:
        return status;
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/calculators/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t("common.deleted"),
        description: t("calculator.deleteSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calculators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="text-right">{t("common.calculatorName")}</TableHead>
            <TableHead className="text-right">{t("common.investor")}</TableHead>
            <TableHead className="text-right">{t("common.updated")}</TableHead>
            <TableHead className="text-right">{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calculators.map((calculator) => (
            <TableRow key={calculator.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="text-sm font-medium text-gray-900">{calculator.name}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">{calculator.investor}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">{calculator.updatedAt}</div>
              </TableCell>
              <TableCell>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(calculator.status)}`}>
                  {getStatusText(calculator.status)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2 space-x-reverse">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => onEdit && onEdit(calculator.id)}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setCalculatorToDelete(calculator.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("calculator.confirmDelete")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("calculator.deleteWarning")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {t("common.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CalculatorTable;
