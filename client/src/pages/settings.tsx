import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  CreditCard, 
  Lock, 
  Bell, 
  Crown,
  Download,
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    company: user?.company || ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notifications, setNotifications] = useState({
    scanAlerts: false,
    weeklyReports: true,
    marketing: false
  });

  // Fetch subscription and billing data
  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/billing/subscription'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/billing/subscription');
      return response as { subscription: any };
    }
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['/api/billing/invoices'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/billing/invoices');
      return response as { invoices: any[] };
    }
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/billing/cancel-subscription');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of your billing period."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/billing/reactivate-subscription');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription will continue automatically."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('PUT', '/api/auth/profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const response = await apiRequest('PUT', '/api/auth/change-password', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully!"
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    }
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (field: string) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-settings-title">Account Settings</h1>
            <p className="text-muted-foreground">Manage your profile and subscription</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-1" data-testid="nav-settings">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center space-x-3 px-4 py-3 w-full rounded-lg font-medium transition-colors text-left ${
                      activeTab === id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                    data-testid={`button-nav-${id}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-6">
              {activeTab === "profile" && (
                <Card data-testid="card-profile-settings">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                        {user?.firstName?.[0] || user?.email[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{formData.firstName} {formData.lastName}</p>
                        <p className="text-sm text-muted-foreground">{formData.email}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          data-testid="input-first-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        data-testid="input-email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                        placeholder="Your Company"
                        data-testid="input-company"
                      />
                    </div>

                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === "subscription" && (
                <div className="space-y-6">
                  {/* Current Subscription */}
                  <Card data-testid="card-subscription-settings">
                    <CardHeader>
                      <CardTitle>Current Subscription</CardTitle>
                      <CardDescription>Manage your subscription and billing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-gradient-card rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-2xl font-bold mb-1">
                              {subscriptionData?.subscription?.tierName || 'FREE'} Plan
                            </div>
                            <Badge className={
                              subscriptionData?.subscription?.status === 'active' 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-primary/10 text-primary'
                            }>
                              {subscriptionData?.subscription?.status?.toUpperCase() || 'FREE'}
                            </Badge>
                          </div>
                          <Crown className="h-12 w-12 text-primary" />
                        </div>

                        {subscriptionData?.subscription && (
                          <>
                            {subscriptionData.subscription.paymentMethod && (
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <CreditCard className="h-4 w-4" />
                                  <span className="capitalize">{subscriptionData.subscription.paymentMethod.brand}</span>
                                  <span>•••• {subscriptionData.subscription.paymentMethod.last4}</span>
                                  <span className="text-muted-foreground">
                                    Expires {subscriptionData.subscription.paymentMethod.expMonth}/{subscriptionData.subscription.paymentMethod.expYear}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {subscriptionData.subscription.cancelAtPeriodEnd 
                                  ? 'Cancels' 
                                  : 'Renews'} on {new Date(subscriptionData.subscription.currentPeriodEnd * 1000).toLocaleDateString()}
                              </span>
                            </div>

                            {subscriptionData.subscription.cancelAtPeriodEnd && (
                              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg mt-4">
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                                <p className="text-sm">
                                  Your subscription will be canceled at the end of your billing period.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {subscriptionData?.subscription ? (
                          <>
                            {subscriptionData.subscription.cancelAtPeriodEnd ? (
                              <Button 
                                onClick={() => reactivateSubscriptionMutation.mutate()}
                                disabled={reactivateSubscriptionMutation.isPending}
                                className="flex-1"
                              >
                                Reactivate Subscription
                              </Button>
                            ) : (
                              <Button 
                                variant="destructive"
                                onClick={() => cancelSubscriptionMutation.mutate()}
                                disabled={cancelSubscriptionMutation.isPending}
                              >
                                Cancel Subscription
                              </Button>
                            )}
                            <Link href="/pricing" className="flex-1">
                              <Button variant="outline" className="w-full">
                                Change Plan
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Link href="/pricing" className="flex-1">
                            <Button className="w-full" data-testid="button-upgrade-plan">
                              Upgrade to Premium
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoices */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing History</CardTitle>
                      <CardDescription>Download your past invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {invoicesData?.invoices && invoicesData.invoices.length > 0 ? (
                        <div className="space-y-3">
                          {invoicesData.invoices.map((invoice: any) => (
                            <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Invoice #{invoice.number}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(invoice.created * 1000).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-medium">${invoice.amount.toFixed(2)} {invoice.currency}</p>
                                  <Badge variant={invoice.paid ? "default" : "secondary"} className="mt-1">
                                    {invoice.paid ? 'Paid' : invoice.status}
                                  </Badge>
                                </div>
                                {invoice.invoicePdf && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    asChild
                                  >
                                    <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No invoices yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "security" && (
                <Card data-testid="card-security-settings">
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                            data-testid="input-current-password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                            data-testid="input-new-password"
                          />
                          <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                            data-testid="input-confirm-password"
                          />
                        </div>
                        <Button 
                          onClick={handleChangePassword}
                          disabled={changePasswordMutation.isPending}
                          data-testid="button-change-password"
                        >
                          {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "notifications" && (
                <Card data-testid="card-notification-settings">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <div className="font-medium">QR Code Scans</div>
                              <div className="text-sm text-muted-foreground">Get notified when your QR codes are scanned</div>
                            </div>
                            <Switch 
                              checked={notifications.scanAlerts}
                              onCheckedChange={() => handleNotificationToggle('scanAlerts')}
                              data-testid="switch-scan-alerts"
                            />
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <div className="font-medium">Weekly Reports</div>
                              <div className="text-sm text-muted-foreground">Receive weekly analytics summaries</div>
                            </div>
                            <Switch 
                              checked={notifications.weeklyReports}
                              onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                              data-testid="switch-weekly-reports"
                            />
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <div className="font-medium">Marketing Updates</div>
                              <div className="text-sm text-muted-foreground">Product updates and tips</div>
                            </div>
                            <Switch 
                              checked={notifications.marketing}
                              onCheckedChange={() => handleNotificationToggle('marketing')}
                              data-testid="switch-marketing"
                            />
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => {
                        toast({
                          title: "Success",
                          description: "Notification preferences saved!"
                        });
                      }}>
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
