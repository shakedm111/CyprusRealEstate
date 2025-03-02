import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Calculators from "@/pages/calculators";
import PropertyCalculator from "@/pages/property-calculator";
import Properties from "@/pages/properties";
import Investors from "@/pages/investors";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-12 h-12 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/login" component={Login} />
        
        {/* Protected routes */}
        {user ? (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/calculators" component={Calculators} />
            <Route path="/calculators/property" component={PropertyCalculator} />
            <Route path="/properties" component={Properties} />
            <Route path="/investors" component={Investors} />
          </>
        ) : (
          // Redirect to login if not authenticated
          <Route path="/">
            {() => {
              window.location.href = "/login";
              return null;
            }}
          </Route>
        )}
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
