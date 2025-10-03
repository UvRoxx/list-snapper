import { useState } from "react";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Register() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    company: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setErrorDialog({
        title: "Missing Information",
        message: "Please fill in all required fields to continue."
      });
      return;
    }

    if (formData.password.length < 6) {
      setErrorDialog({
        title: "Password Too Short",
        message: "Your password must be at least 6 characters long for security."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await register(formData);
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred during registration";
      
      // Parse better error messages
      let displayMessage = errorMessage;
      if (errorMessage.includes("User already exists")) {
        displayMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (errorMessage.includes("400")) {
        try {
          const jsonMatch = errorMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.message === "User already exists") {
              displayMessage = "An account with this email already exists. Please try logging in instead.";
            } else {
              displayMessage = parsed.message || displayMessage;
            }
          }
        } catch (e) {
          // Keep original message if parsing fails
        }
      }
      
      setErrorDialog({
        title: "Registration Failed",
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
            <h2 className="text-3xl font-bold mb-2" data-testid="text-create-account">Create Your Account</h2>
            <p className="text-muted-foreground">Start managing your QR codes today</p>
          </div>

          <Card data-testid="card-register-form">
            <CardHeader>
              <CardTitle className="sr-only">Registration Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={handleChange}
                    data-testid="input-company"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    data-testid="input-password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-create-account"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/api/auth/google'}
                  data-testid="button-google-signup"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/api/auth/facebook'}
                  data-testid="button-facebook-signup"
                >
                  <SiFacebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in here
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
