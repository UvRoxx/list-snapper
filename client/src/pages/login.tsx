import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { QrCode, AlertCircle } from "lucide-react";
import { SiGoogle, SiFacebook } from "react-icons/si";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorDialog({
        title: "Missing Information",
        message: "Please fill in all fields to continue."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (error: any) {
      const errorMessage = error.message || "Invalid credentials";
      
      // Parse better error messages
      let displayMessage = errorMessage;
      if (errorMessage.includes("Invalid credentials")) {
        displayMessage = "The email or password you entered is incorrect. Please try again.";
      } else if (errorMessage.includes("400")) {
        try {
          const jsonMatch = errorMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            displayMessage = parsed.message || displayMessage;
          }
        } catch (e) {
          // Keep original message if parsing fails
        }
      }
      
      setErrorDialog({
        title: "Login Failed",
        message: displayMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2" data-testid="text-welcome">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to your ListSnapper account</p>
          </div>

          <Card data-testid="card-login-form">
            <CardHeader>
              <CardTitle className="sr-only">Login Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm">Remember me</Label>
                  </div>
                  <Link href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-signin"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/api/auth/google'}
                  data-testid="button-google-login"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/api/auth/facebook'}
                  data-testid="button-facebook-login"
                >
                  <SiFacebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    Sign up for free
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <AlertDialog open={!!errorDialog} onOpenChange={(open) => !open && setErrorDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>{errorDialog?.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base pt-2">
              {errorDialog?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog(null)} data-testid="button-error-ok">
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
