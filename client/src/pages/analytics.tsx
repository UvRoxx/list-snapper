import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { 
  Eye, 
  Users, 
  BarChart3, 
  Clock, 
  ArrowUp, 
  ArrowDown,
  Download,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  
  const { data: qrCodes = [] } = useQuery({
    queryKey: ['/api/qr-codes'],
    enabled: !!user
  });

  // Calculate aggregate stats from QR codes
  const totalScans = qrCodes.reduce((acc: number, qr: any) => acc + (qr.scanCount || 0), 0);
  const uniqueVisitors = Math.round(totalScans * 0.65); // Estimate unique visitors
  const avgDaily = Math.round(totalScans / 30); // Estimate daily average

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" data-testid="text-analytics-title">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Track performance and insights</p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-3">
                <Select defaultValue="7days">
                  <SelectTrigger data-testid="select-time-period">
                    <SelectValue placeholder="Last 7 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" data-testid="button-export-analytics">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card data-testid="stat-total-scans">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground text-sm">Total Scans</span>
                  <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-chart-1" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">{totalScans.toLocaleString()}</div>
                <div className="flex items-center text-sm">
                  <ArrowUp className="h-4 w-4 text-chart-4 mr-1" />
                  <span className="text-chart-4">23.5%</span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-unique-visitors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground text-sm">Unique Visitors</span>
                  <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-chart-2" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">{uniqueVisitors.toLocaleString()}</div>
                <div className="flex items-center text-sm">
                  <ArrowUp className="h-4 w-4 text-chart-4 mr-1" />
                  <span className="text-chart-4">18.2%</span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-avg-daily">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground text-sm">Avg. Daily Scans</span>
                  <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-chart-3" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">{avgDaily.toLocaleString()}</div>
                <div className="flex items-center text-sm">
                  <ArrowDown className="h-4 w-4 text-destructive mr-1" />
                  <span className="text-destructive">5.3%</span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-peak-hour">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground text-sm">Peak Hour</span>
                  <div className="w-10 h-10 bg-chart-5/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-chart-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">2-3 PM</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Most active time</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Scans Over Time Chart */}
            <Card data-testid="card-scans-over-time">
              <CardHeader>
                <CardTitle>Scans Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-2">
                  <div className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" style={{height: "45%"}}></div>
                  <div className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" style={{height: "60%"}}></div>
                  <div className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" style={{height: "75%"}}></div>
                  <div className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" style={{height: "55%"}}></div>
                  <div className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" style={{height: "90%"}}></div>
                  <div className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" style={{height: "85%"}}></div>
                  <div className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" style={{height: "70%"}}></div>
                </div>
                <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card data-testid="card-device-breakdown">
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center">
                      <Smartphone className="h-4 w-4 text-chart-1 mr-2" />
                      Mobile
                    </span>
                    <span className="font-semibold">68%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-1 rounded-full" style={{width: "68%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center">
                      <Monitor className="h-4 w-4 text-chart-2 mr-2" />
                      Desktop
                    </span>
                    <span className="font-semibold">24%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-2 rounded-full" style={{width: "24%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center">
                      <Tablet className="h-4 w-4 text-chart-3 mr-2" />
                      Tablet
                    </span>
                    <span className="font-semibold">8%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-3 rounded-full" style={{width: "8%"}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Locations */}
            <Card data-testid="card-top-locations">
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">🇺🇸</div>
                    <span>United States</span>
                  </div>
                  <span className="font-semibold">42%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">🇬🇧</div>
                    <span>United Kingdom</span>
                  </div>
                  <span className="font-semibold">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">🇨🇦</div>
                    <span>Canada</span>
                  </div>
                  <span className="font-semibold">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">🇦🇺</div>
                    <span>Australia</span>
                  </div>
                  <span className="font-semibold">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">🇩🇪</div>
                    <span>Germany</span>
                  </div>
                  <span className="font-semibold">5%</span>
                </div>
              </CardContent>
            </Card>

            {/* Browser Stats */}
            <Card data-testid="card-browser-stats">
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-chart-1 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span>Chrome</span>
                  </div>
                  <span className="font-semibold">52%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-chart-2 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span>Safari</span>
                  </div>
                  <span className="font-semibold">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-chart-3 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span>Firefox</span>
                  </div>
                  <span className="font-semibold">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-chart-4 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span>Edge</span>
                  </div>
                  <span className="font-semibold">8%</span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Systems */}
            <Card data-testid="card-operating-systems">
              <CardHeader>
                <CardTitle>Operating Systems</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded bg-chart-4 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">A</span>
                    </div>
                    <span>Android</span>
                  </div>
                  <span className="font-semibold">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded bg-chart-1 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">i</span>
                    </div>
                    <span>iOS</span>
                  </div>
                  <span className="font-semibold">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded bg-chart-2 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">W</span>
                    </div>
                    <span>Windows</span>
                  </div>
                  <span className="font-semibold">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded bg-chart-3 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">M</span>
                    </div>
                    <span>macOS</span>
                  </div>
                  <span className="font-semibold">5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
