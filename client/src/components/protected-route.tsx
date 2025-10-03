import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  message?: string;
}

export function ProtectedRoute({ children, requireAuth = true, redirectTo = "/login", message }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user && requireAuth) {
      if (message) {
        toast({
          title: "Sign up required",
          description: message,
          variant: "default",
        });
      }
      setLocation(redirectTo);
    }
  }, [user, isLoading, setLocation, requireAuth, redirectTo, message, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
