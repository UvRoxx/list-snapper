import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QrCodeCard } from "@/components/qr-code-card";
import { useAuth } from "@/hooks/use-auth";
import { 
  QrCode, 
  Plus, 
  Search, 
  BarChart3, 
  CheckCircle, 
  Crown, 
  Grid, 
  List,
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { data: qrCodes = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/qr-codes'],
    enabled: !!user
  });

  const { data: planLimits, isLoading: isPlanLimitsLoading } = useQuery<any>({
    queryKey: ['/api/plan-limits'],
    enabled: !!user
  });

  // Filter and sort QR codes
  const filteredAndSortedQrCodes = useMemo(() => {
    let filtered = [...qrCodes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((qr: any) => 
        qr.name.toLowerCase().includes(query) ||
        qr.shortCode.toLowerCase().includes(query) ||
        qr.destinationUrl.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((qr: any) => qr.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((qr: any) => !qr.isActive);
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "scans":
          return (b.scanCount || 0) - (a.scanCount || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [qrCodes, searchQuery, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      
      {/* Dashboard Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">{t('my_qr_codes')}</h1>
              <p className="text-muted-foreground">{t('manage_track_qr')}</p>
            </div>
            <Link href="/create">
              <Button 
                className="mt-4 md:mt-0" 
                data-testid="button-create-qr"
                disabled={!planLimits?.canCreateMore}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('create_qr_code')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plan Limit Warning */}
        {planLimits && !planLimits.canCreateMore && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>QR Code Limit Reached</AlertTitle>
            <AlertDescription>
              You've reached your {planLimits.displayName} plan limit of {planLimits.maxQrCodes} QR codes.{' '}
              <Link href="/pricing">
                <span className="underline cursor-pointer font-semibold">Upgrade your plan</span>
              </Link>{' '}
              to create more QR codes.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Approaching Limit Warning */}
        {planLimits && planLimits.canCreateMore && planLimits.maxQrCodes !== null && 
         planLimits.currentQrCodes >= planLimits.maxQrCodes * 0.8 && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-yellow-600 dark:text-yellow-500">Approaching Limit</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              You're using {planLimits.currentQrCodes} of {planLimits.maxQrCodes} QR codes on your {planLimits.displayName} plan.{' '}
              <Link href="/pricing">
                <span className="underline cursor-pointer font-semibold">Upgrade now</span>
              </Link>{' '}
              to get more.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-total-codes">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">{t('total_qr_codes')}</span>
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{qrCodes.length}</div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-primary">{t('active')}</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-scans">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">{t('total_scans')}</span>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {qrCodes.reduce((acc: number, qr: any) => acc + (qr.scanCount || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Across all QR codes
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-codes">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">{t('active_codes')}</span>
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {qrCodes.filter((qr: any) => qr.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {qrCodes.length > 0 ? Math.round((qrCodes.filter((qr: any) => qr.isActive).length / qrCodes.length) * 100) : 0}% {t('of_total')}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-plan-limit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">{t('plan_limit')}</span>
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {planLimits?.currentQrCodes || 0}/{planLimits?.maxQrCodes === null ? '∞' : planLimits?.maxQrCodes || 5}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {planLimits?.displayName || 'Free'} {t('plan_limit').toLowerCase()}
              </div>
              {planLimits?.stickerCredits > 0 && (
                <div className="text-sm text-primary mt-2 font-semibold">
                  🎟️ {planLimits.stickerCredits} free stickers
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          placeholder={t('search_qr_codes')}
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          data-testid="input-search-qr"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search by name, short code, or destination URL</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder={t('all_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_status')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort-filter">
                    <SelectValue placeholder={t('sort_by')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t('sort_by')} Date</SelectItem>
                    <SelectItem value="scans">{t('sort_by')} Scans</SelectItem>
                    <SelectItem value="name">{t('sort_by')} {t('name')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border border-border rounded-lg">
                  <Button 
                    variant={viewMode === "grid" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setViewMode("grid")}
                    data-testid="button-grid-view"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setViewMode("list")}
                    data-testid="button-list-view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Codes Grid */}
        {qrCodes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('cart_empty')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('add_products')}
              </p>
              <Link href="/create">
                <Button data-testid="button-create-first-qr">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('create_qr_code')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredAndSortedQrCodes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                {t('clear_cart')}
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-qr-codes">
            {filteredAndSortedQrCodes.map((qrCode: any) => (
              <QrCodeCard key={qrCode.id} qrCode={qrCode} />
            ))}
          </div>
        ) : (
          <div className="space-y-4" data-testid="list-qr-codes">
            {filteredAndSortedQrCodes.map((qrCode: any) => (
              <Card key={qrCode.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <QrCode className="h-8 w-8" />
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Name</div>
                          <h3 className="font-semibold text-lg">{qrCode.name}</h3>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Destination</div>
                          <p className="text-sm truncate">{qrCode.destinationUrl}</p>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Stats</div>
                          <div className="flex items-center gap-3 text-sm">
                            <span>{qrCode.scanCount || 0} scans</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${qrCode.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {qrCode.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/qr/${qrCode.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
