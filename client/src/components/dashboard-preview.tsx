import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  QrCode, 
  Plus, 
  Search, 
  BarChart3, 
  CheckCircle, 
  Crown,
  Grid,
  List,
  Eye,
  Download,
  MoreVertical
} from "lucide-react";

const dummyQRCodes = [
  { id: "1", name: "1234 Ocean View Dr, Miami", shortCode: "ocean1234", destinationUrl: "https://realestate.com/listings/ocean-view-miami", isActive: true, scanCount: 342 },
  { id: "2", name: "567 Park Ave, Manhattan", shortCode: "park567", destinationUrl: "https://realestate.com/listings/park-ave-manhattan", isActive: true, scanCount: 1247 },
  { id: "3", name: "890 Sunset Blvd, Los Angeles", shortCode: "sunset890", destinationUrl: "https://realestate.com/listings/sunset-la", isActive: true, scanCount: 89 },
];

export function DashboardPreview() {
  const [totalScans, setTotalScans] = useState(1678);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Animate scans
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalScans((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Cycle cards
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => (prev + 1) % dummyQRCodes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-background border-2 border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My QR Codes</h1>
              <p className="text-muted-foreground">Manage and track your QR codes</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create QR Code
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Total QR Codes</span>
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold">{dummyQRCodes.length}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-primary">Active</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Total Scans</span>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold tabular-nums">{totalScans.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="text-primary">+12%</span> vs last month
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Active Codes</span>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold">{dummyQRCodes.length}</div>
                <div className="text-sm text-muted-foreground mt-1">100% of total</div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Plan Limit</span>
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold">{dummyQRCodes.length}/5</div>
                <div className="text-sm text-muted-foreground mt-1">Free Plan</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Search QR codes..." className="pl-10" disabled />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Select defaultValue="all" disabled>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="date" disabled>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex border border-border rounded-lg">
                    <Button variant="ghost" size="sm" disabled><Grid className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" disabled><List className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {dummyQRCodes.map((qr, index) => (
              <Card key={qr.id} className={`hover:shadow-lg transition-all duration-500 ${highlightedIndex === index ? "ring-2 ring-primary shadow-xl" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{qr.name}</h3>
                      <Badge variant="default" className="text-xs">Active</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center border">
                    <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Short Code:</span>
                      <span className="font-mono font-semibold">{qr.shortCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scans:</span>
                      <span className="font-semibold">{qr.scanCount}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{qr.destinationUrl}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <Eye className="h-3 w-3 mr-1" />View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <Download className="h-3 w-3 mr-1" />Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
