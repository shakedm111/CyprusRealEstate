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
  DialogTrigger,
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";

// Property schema for form validation
const propertySchema = z.object({
  name: z.string().min(1, { message: "Property name is required" }),
  priceWithoutVAT: z.coerce.number().positive({ message: "Price must be a positive number" }),
  monthlyRent: z.coerce.number().positive({ message: "Monthly rent must be a positive number" }),
  guaranteedRent: z.coerce.number().positive({ message: "Guaranteed rent must be a positive number" }).optional().nullable(),
  deliveryDate: z.string().min(1, { message: "Delivery date is required" }),
  bedrooms: z.coerce.number().int().positive({ message: "Number of bedrooms must be a positive integer" }),
  hasFurniture: z.boolean().default(false),
  hasPropertyManagement: z.boolean().default(false),
  hasRealEstateAgent: z.boolean().default(false),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

type Property = {
  id: number;
  name: string;
  priceWithoutVAT: number;
  monthlyRent: number;
  guaranteedRent: number | null;
  deliveryDate: string;
  bedrooms: number;
  hasFurniture: boolean;
  hasPropertyManagement: boolean;
  hasRealEstateAgent: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function Properties() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdvisor = user?.role === "advisor";
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);

  // Set default values for the form
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      priceWithoutVAT: 0,
      monthlyRent: 0,
      guaranteedRent: null,
      deliveryDate: "",
      bedrooms: 1,
      hasFurniture: false,
      hasPropertyManagement: false,
      hasRealEstateAgent: false,
    },
  });

  // Reset form when dialog opens for new property
  const openNewPropertyDialog = () => {
    form.reset({
      name: "",
      priceWithoutVAT: 0,
      monthlyRent: 0,
      guaranteedRent: null,
      deliveryDate: "",
      bedrooms: 1,
      hasFurniture: false,
      hasPropertyManagement: false,
      hasRealEstateAgent: false,
    });
    setEditingProperty(null);
    setIsDialogOpen(true);
  };

  // Open dialog with property data for editing
  const openEditPropertyDialog = (property: Property) => {
    form.reset({
      name: property.name,
      priceWithoutVAT: property.priceWithoutVAT,
      monthlyRent: property.monthlyRent,
      guaranteedRent: property.guaranteedRent,
      deliveryDate: property.deliveryDate,
      bedrooms: property.bedrooms,
      hasFurniture: property.hasFurniture,
      hasPropertyManagement: property.hasPropertyManagement,
      hasRealEstateAgent: property.hasRealEstateAgent,
    });
    setEditingProperty(property);
    setIsDialogOpen(true);
  };

  // Fetch properties
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    refetchOnWindowFocus: false,
  });

  // Create property mutation
  const createMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      const res = await apiRequest("POST", "/api/properties", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("property.createSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("property.createError"),
        variant: "destructive",
      });
    },
  });

  // Update property mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PropertyFormValues }) => {
      const res = await apiRequest("PUT", `/api/properties/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("property.updateSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("property.updateError"),
        variant: "destructive",
      });
    },
  });

  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("property.deleteSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("property.deleteError"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PropertyFormValues) => {
    if (editingProperty) {
      await updateMutation.mutateAsync({ id: editingProperty.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async () => {
    if (propertyToDelete) {
      await deleteMutation.mutateAsync(propertyToDelete);
      setPropertyToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{t("common.properties")}</h1>
          {isAdvisor && (
            <Button
              onClick={openNewPropertyDialog}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <i className="fas fa-plus mr-2"></i>
              <span>{t("property.createProperty")}</span>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("property.propertiesList")}</CardTitle>
            <CardDescription>
              {t("property.listDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full" />
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("property.propertyName")}</TableHead>
                      <TableHead>{t("property.price")}</TableHead>
                      <TableHead>{t("property.monthlyRent")}</TableHead>
                      <TableHead>{t("property.bedrooms")}</TableHead>
                      <TableHead>{t("property.deliveryDate")}</TableHead>
                      <TableHead>{t("property.features")}</TableHead>
                      {isAdvisor && <TableHead>{t("common.actions")}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="font-medium">{property.name}</div>
                        </TableCell>
                        <TableCell>€{property.priceWithoutVAT.toLocaleString()}</TableCell>
                        <TableCell>€{property.monthlyRent.toLocaleString()}</TableCell>
                        <TableCell>{property.bedrooms}</TableCell>
                        <TableCell>{property.deliveryDate}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {property.hasFurniture && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                <i className="fas fa-couch mr-1"></i>
                                {t("property.furniture")}
                              </span>
                            )}
                            {property.hasPropertyManagement && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                <i className="fas fa-tasks mr-1"></i>
                                {t("property.management")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {isAdvisor && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditPropertyDialog(property)}
                              >
                                <i className="fas fa-edit text-blue-500"></i>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPropertyToDelete(property.id)}
                                  >
                                    <i className="fas fa-trash text-red-500"></i>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("property.confirmDelete")}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("property.deleteWarning")}
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
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("property.noProperties")}</p>
                {isAdvisor && (
                  <Button
                    onClick={openNewPropertyDialog}
                    variant="outline"
                    className="mt-4"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    {t("property.createFirst")}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? t("property.editProperty") : t("property.createProperty")}
            </DialogTitle>
            <DialogDescription>
              {t("property.formDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("property.propertyName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("property.enterName")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priceWithoutVAT"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("property.price")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>EUR</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("property.monthlyRent")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>EUR</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guaranteedRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("property.guaranteedRent")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>EUR (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("property.bedrooms")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("property.deliveryDate")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="YYYY-MM-DD" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="hasFurniture"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse rtl:space-x-reverse space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("property.hasFurniture")}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hasPropertyManagement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse rtl:space-x-reverse space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("property.hasPropertyManagement")}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hasRealEstateAgent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse rtl:space-x-reverse space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("property.hasRealEstateAgent")}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t("common.saving")}
                    </div>
                  ) : (
                    editingProperty ? t("common.save") : t("common.create")
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
