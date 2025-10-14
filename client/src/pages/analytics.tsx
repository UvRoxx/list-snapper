import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
  Download,
  Smartphone,
  Monitor,
  Tablet,
  ArrowLeft
} from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7days");
  
  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ['/api/analytics', { timeRange }],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30">
          <Navigation />
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const totalScans = analytics?.totalScans || 0;
  const uniqueVisitors = analytics?.uniqueVisitors || 0;
  const avgDailyScans = analytics?.avgDailyScans || 0;
  const peakHour = analytics?.peakHour || 'N/A';
  const deviceBreakdown = analytics?.deviceBreakdown || {};
  const browserBreakdown = analytics?.browserBreakdown || {};
  const osBreakdown = analytics?.osBreakdown || {};
  const locationBreakdown = analytics?.locationBreakdown || {};
  const scanTimeSeries = analytics?.scanTimeSeries || [];

  // Calculate percentages for device breakdown
  const deviceTotal = Object.values(deviceBreakdown).reduce((sum: number, val: any) => sum + val, 0);
  const devicePercentages = Object.entries(deviceBreakdown).map(([device, count]) => ({
    device,
    count: count as number,
    percentage: deviceTotal > 0 ? Math.round((count as number / deviceTotal) * 100) : 0
  }));

  // Get top locations
  const topLocations = Object.entries(locationBreakdown)
    .map(([country, count]) => ({ country, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get top browsers
  const topBrowsers = Object.entries(browserBreakdown)
    .map(([browser, count]) => ({ browser, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Get top OS
  const topOS = Object.entries(osBreakdown)
    .map(([os, count]) => ({ os, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Calculate browser percentages
  const browserTotal = topBrowsers.reduce((sum, b) => sum + b.count, 0);
  const osTotal = topOS.reduce((sum, o) => sum + o.count, 0);
  const locationTotal = topLocations.reduce((sum, l) => sum + l.count, 0);

  // Get country emoji flags (simplified)
  const getCountryEmoji = (country: string) => {
    const emojiMap: Record<string, string> = {
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Unknown': '🌍'
    };
    return emojiMap[country] || '🌍';
  };

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
                <Select value={timeRange} onValueChange={setTimeRange}>
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
          <div className="sticky top-16 z-10 bg-muted/95 backdrop-blur-sm -mx-4 px-4 py-2 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Total scan count</span>
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Unique IP addresses</span>
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
                <div className="text-3xl font-bold mb-2">{avgDailyScans.toLocaleString()}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Per day average</span>
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
                <div className="text-3xl font-bold mb-2">{peakHour}</div>
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
                {scanTimeSeries.length > 0 ? (
                  <>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {scanTimeSeries.slice(-7).map((data: any, index: number) => {
                        const maxScans = Math.max(...scanTimeSeries.map((d: any) => d.count));
                        const height = maxScans > 0 ? (data.count / maxScans) * 100 : 0;
                        return (
                          <div 
                            key={index} 
                            className="flex-1 bg-chart-1/20 rounded-t-lg hover:bg-chart-1/30 transition-colors cursor-pointer" 
                            style={{height: `${height}%`}}
                            title={`${data.date}: ${data.count} scans`}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                      {scanTimeSeries.slice(-7).map((data: any, index: number) => (
                        <span key={index}>{new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No scan data available
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Locations */}
            <Card data-testid="card-top-locations">
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topLocations.length > 0 ? (
                  topLocations.map(({ country, count }) => {
                    const percentage = locationTotal > 0 ? Math.round((count / locationTotal) * 100) : 0;
                    return (
                      <div key={country} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                            {getCountryEmoji(country)}
                          </div>
                          <span>{country}</span>
                        </div>
                        <span className="font-semibold">{percentage}%</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No location data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operating Systems */}
            <Card data-testid="card-operating-systems">
              <CardHeader>
                <CardTitle>Operating Systems</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topOS.length > 0 ? (
                  topOS.map(({ os, count }, index) => {
                    const percentage = osTotal > 0 ? Math.round((count / osTotal) * 100) : 0;
                    const colors = ['chart-4', 'chart-1', 'chart-2', 'chart-3'];
                    const color = colors[index % colors.length];
                    const initial = os[0] || 'U';
                    return (
                      <div key={os} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded bg-${color} flex items-center justify-center`}>
                            <span className="text-xs text-white font-bold">{initial}</span>
                          </div>
                          <span>{os}</span>
                        </div>
                        <span className="font-semibold">{percentage}%</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No OS data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
