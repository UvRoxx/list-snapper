import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { DashboardPreview } from "@/components/dashboard-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  ChartLine, 
  Palette, 
  RotateCcw, 
  Printer, 
  Shield,
  Sparkles,
  Check,
  Zap
} from "lucide-react";

export default function Landing() {
  const { t } = useTranslation('common');
  
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
              <span className="text-sm font-medium">{t('smart_qr_platform')}</span>
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 leading-tight" 
              data-testid="text-hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t('create_track_manage')}
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8" 
              data-testid="text-hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {t('dynamic_qr_description')}
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link href="/register">
                <Button size="lg" className="px-8 py-4 font-semibold hover:scale-105 transition-transform" data-testid="button-start-trial">
                  {t('start_free_trial')}
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="px-8 py-4 font-semibold hover:scale-105 transition-transform" data-testid="button-view-pricing">
                  {t('view_pricing')}
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
                <span>{t('no_credit_card')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{t('free_forever')}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Dashboard Preview */}
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <DashboardPreview />
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
              {t('everything_you_need')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('powerful_features')}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: ChartLine, titleKey: "advanced_analytics", descKey: "advanced_analytics_desc", testId: "card-feature-analytics" },
              { icon: Palette, titleKey: "custom_branding", descKey: "custom_branding_desc", testId: "card-feature-branding" },
              { icon: RotateCcw, titleKey: "dynamic_urls", descKey: "dynamic_urls_desc", testId: "card-feature-dynamic" },
              { icon: Printer, titleKey: "physical_products", descKey: "physical_products_desc", testId: "card-feature-products" },
              { icon: Zap, titleKey: "instant_updates", descKey: "instant_updates_desc", testId: "card-feature-instant" },
              { icon: Shield, titleKey: "enterprise_security", descKey: "enterprise_security_desc", testId: "card-feature-security" }
            ].map((feature, index) => (
              <motion.div
                key={feature.titleKey}
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
                    <h3 className="text-xl font-semibold mb-3">{t(feature.titleKey)}</h3>
                    <p className="text-muted-foreground">{t(feature.descKey)}</p>
                  </CardContent>
                </Card>
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
          <h2 className="text-4xl font-bold mb-4" data-testid="text-cta-title">{t('ready_to_start')}</h2>
          <p className="text-xl text-muted-foreground mb-8">{t('join_thousands')}</p>
          <Link href="/register">
            <Button size="lg" className="px-8 py-4 font-semibold hover:scale-105 transition-transform" data-testid="button-start-trial-cta">
              {t('start_trial')}
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
              <p className="text-muted-foreground text-sm">{t('smart_qr_tagline')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('product')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('features')}</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">{t('pricing')}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('api')}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('integrations')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('company')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('about')}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('blog')}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('careers')}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('privacy')}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('terms')}</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">{t('security')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>{t('all_rights_reserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
