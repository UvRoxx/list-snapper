import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { QrCode, Moon, Sun, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { i18n: i18nInstance } = useTranslation();
  const [language, setLanguage] = useState(() => 
    localStorage.getItem('language') || 'en'
  );

  useEffect(() => {
    if (i18nInstance && typeof i18nInstance.changeLanguage === 'function') {
      i18nInstance.changeLanguage(language);
      localStorage.setItem('language', language);
    }
  }, [language, i18nInstance]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ListSnapper</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              {!user && (
                <>
                  <Link 
                    href="/" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/pricing" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </>
              )}
              {user && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                  {user.isAdmin && (
                    <Link 
                      href="/admin" 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="link-admin"
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-16" data-testid="select-language">
                <Globe className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              data-testid="button-theme-toggle"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <>
                {user.membership && (
                  <Badge 
                    variant={user.membership.tierName === 'PRO' ? 'default' : user.membership.tierName === 'STANDARD' ? 'secondary' : 'outline'}
                    className="hidden sm:flex"
                    data-testid="badge-membership-tier"
                  >
                    {user.membership.tierName}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" data-testid="button-user-menu">
                      {user.firstName?.[0] || user.email[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()} data-testid="button-logout">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-login">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button data-testid="button-signup">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
