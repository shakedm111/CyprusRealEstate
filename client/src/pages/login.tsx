import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TelemLogo from "../lib/telemLogo";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const { login } = useAuth();
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await login(values.username, values.password);
      if (success) {
        setLocation("/dashboard");
      } else {
        setError(t("login.loginError"));
      }
    } catch (err) {
      setError(t("login.loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`min-h-[100dvh] bg-gray-100 flex items-center justify-center p-0 m-0 ${isRtl ? "text-right" : "text-left"}`}
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}  
    >
      <div className="absolute top-[15%] w-full flex justify-center">
        <TelemLogo className="h-10" />
      </div>
      
      <div className="w-[85%] max-w-[320px] transform translate-y-[2%]">
        <Card className="shadow-lg border-0">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-lg font-semibold text-center">{t("login.title")}</CardTitle>
            <CardDescription className="text-center text-xs mt-1">
              {t("login.welcomeMessage")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-2 px-5">
            {error && (
              <Alert variant="destructive" className="mb-2 py-1 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium">{t("common.username")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("common.username")} {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium">{t("common.password")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t("common.password")} {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-500 hover:bg-teal-600 h-8 text-sm mt-2" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      <span className="text-xs">{t("login.loggingIn")}</span>
                    </div>
                  ) : (
                    t("common.login")
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center pt-0 pb-3 px-4">
            <p className="text-[10px] text-gray-500">
              {t("login.contactAdmin")}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}