import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, ExternalLink, Loader2 } from "lucide-react";

export default function BrandedRedirect() {
  const { shortCode } = useParams();
  const [qrCode, setQrCode] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Fetch QR code data
    fetch(`/api/redirect-info/${shortCode}`)
      .then(res => res.json())
      .then(data => {
        setQrCode(data);
      })
      .catch(() => {
        window.location.href = '/';
      });
  }, [shortCode]);

  useEffect(() => {
    if (!qrCode) return;

    // Countdown
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect after countdown
      setIsRedirecting(true);
      setTimeout(() => {
        window.location.href = qrCode.destinationUrl;
      }, 500);
    }
  }, [countdown, qrCode]);

  const handleContinue = () => {
    setIsRedirecting(true);
    window.location.href = qrCode.destinationUrl;
  };

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
              <QrCode className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-1">ListSnapper</h1>
            <p className="text-sm text-muted-foreground">Smart QR Code Management</p>
          </div>

          {/* QR Code Info */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="text-sm text-muted-foreground mb-1">You're being redirected to:</div>
            <div className="font-semibold text-lg mb-2">{qrCode.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {qrCode.destinationUrl}
            </div>
          </div>

          {/* Countdown or Continue */}
          {isRedirecting ? (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          ) : countdown > 0 ? (
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-primary mb-2">{countdown}</div>
              <p className="text-sm text-muted-foreground mb-4">Redirecting automatically...</p>
              <Button 
                onClick={handleContinue}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue Now
              </Button>
            </div>
          ) : null}

          {/* Powered by */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-foreground">ListSnapper</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your own QR codes at{" "}
              <a href="/" className="text-primary hover:underline">
                listsnapper.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

