import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  ChartLine, 
  Palette, 
  RotateCcw, 
  Printer, 
  Code, 
  Shield,
  Sparkles,
  Check
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-card opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Smart QR Code Management Platform</span>
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 leading-tight" 
              data-testid="text-hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Create, Track & Manage
              <span className="text-primary"> QR Codes</span> Like Never Before
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8" 
              data-testid="text-hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Dynamic QR codes with powerful analytics, custom branding, and seamless ordering for physical products. All in one beautiful platform.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link href="/register">
                <Button size="lg" className="px-8 py-4 font-semibold hover:scale-105 transition-transform" data-testid="button-start-trial">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="px-8 py-4 font-semibold hover:scale-105 transition-transform" data-testid="button-view-pricing">
                  View Pricing
                </Button>
              </Link>
            </motion.div>
            <motion.div 
              className="mt-12 flex items-center justify-center space-x-8 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Free forever plan</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image Mockup */}
          <motion.div 
            className="mt-16 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border hover:shadow-3xl transition-shadow duration-300">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
                alt="Dashboard preview showing analytics and QR code management" 
                className="w-full"
                data-testid="img-dashboard-preview"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4" data-testid="text-features-title">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground">Powerful features designed for modern businesses</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: ChartLine, title: "Advanced Analytics", description: "Track scans in real-time with detailed insights on location, devices, and user behavior.", testId: "card-feature-analytics" },
              { icon: Palette, title: "Custom Branding", description: "Customize QR codes with your brand colors, logo, and design preferences.", testId: "card-feature-branding" },
              { icon: RotateCcw, title: "Dynamic URLs", description: "Update destination URLs anytime without changing your QR code.", testId: "card-feature-dynamic" },
              { icon: Printer, title: "Physical Products", description: "Order professional stickers and yard signs with your QR codes printed.", testId: "card-feature-products" },
              { icon: Code, title: "API Access", description: "Integrate QR code generation into your apps with our powerful API.", testId: "card-feature-api" },
              { icon: Shield, title: "Enterprise Security", description: "Bank-level encryption and security for all your QR code data.", testId: "card-feature-security" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg hover:scale-105 transition-all duration-300" data-testid={feature.testId}>
                  <CardContent className="p-8">
                    <motion.div 
                      className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="h-6 w-6 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10M+", label: "QR Codes Created", testId: "stat-qr-codes" },
              { value: "500M+", label: "Total Scans", testId: "stat-scans" },
              { value: "50K+", label: "Active Users", testId: "stat-users" },
              { value: "150+", label: "Countries", testId: "stat-countries" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                data-testid={stat.testId}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div 
                  className="text-4xl font-bold text-primary mb-2"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <motion.div 
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4" data-testid="text-cta-title">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">Join thousands of businesses using ListSnapper</p>
          <Link href="/register">
            <Button size="lg" className="px-8 py-4 font-semibold hover:scale-105 transition-transform" data-testid="button-start-trial-cta">
              Start Your Free Trial
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-primary-foreground rounded"></div>
                </div>
                <span className="text-lg font-bold">ListSnapper</span>
              </div>
              <p className="text-muted-foreground text-sm">Smart QR code management for modern businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ListSnapper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
