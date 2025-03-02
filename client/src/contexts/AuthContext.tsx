import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "advisor" | "investor";
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Get token from localStorage
  const getToken = () => localStorage.getItem('auth_token');
  
  // Query to fetch the current user
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/current-user"],
    retry: false,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // If we get a 401, return null instead of throwing an error
    queryFn: async ({ queryKey }) => {
      try {
        const token = getToken();
        
        if (!token) {
          return null;
        }
        
        const res = await fetch(queryKey[0] as string, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (err) {
        console.error("Error fetching current user:", err);
        return null;
      }
    },
  });

  // Set the user whenever the data changes
  useEffect(() => {
    if (data) {
      setUser(data);
    } else {
      setUser(null);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setUser(data.user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.name}!`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      console.error("Login error:", error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return await res.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      // Redirect to login page
      window.location.href = "/login";
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
      console.error("Logout error:", error);
    },
  });

  const login = async (username: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ username, password });
      return result.success;
    } catch (err) {
      return false;
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: error as Error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
