import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import "./lib/i18n";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import CreateQR from "@/pages/create-qr";
import QrDetail from "@/pages/qr-detail";
import Analytics from "@/pages/analytics";
import Orders from "@/pages/orders";
import Cart from "@/pages/cart";
import CheckoutCart from "@/pages/checkout-cart";
import Settings from "@/pages/settings";
import Checkout from "@/pages/checkout";
import AdminDashboard from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create" component={CreateQR} />
      <Route path="/qr/:id" component={QrDetail} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/orders" component={Orders} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout-cart" component={CheckoutCart} />
      <Route path="/settings" component={Settings} />
      <Route path="/checkout/:tier" component={Checkout} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="listsnapper-theme">
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
