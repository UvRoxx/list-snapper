import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    common: {
      "title": "ListSnapper - Smart QR Code Management",
      "subtitle": "Create, Track & Manage QR Codes Like Never Before",
      "description": "Dynamic QR codes with powerful analytics, custom branding, and seamless ordering for physical products. All in one beautiful platform.",
      "get_started": "Get Started",
      "sign_up": "Sign Up", 
      "log_in": "Log In",
      "dashboard": "Dashboard",
      "pricing": "Pricing",
      "analytics": "Analytics",
      "orders": "Orders",
      "settings": "Settings",
      "create_qr": "Create QR Code",
      "free": "FREE",
      "standard": "STANDARD", 
      "pro": "PRO",
      "features": "Features",
      "qr_codes": "QR Codes",
      "scans": "Scans",
      "analytics_dashboard": "Analytics Dashboard"
    }
  },
  fr: {
    common: {
      "title": "ListSnapper - Gestion Intelligente de Codes QR",
      "subtitle": "Créez, Suivez et Gérez les Codes QR Comme Jamais Auparavant",
      "description": "Codes QR dynamiques avec analyses puissantes, image de marque personnalisée et commande transparente de produits physiques. Tout dans une belle plateforme.",
      "get_started": "Commencer",
      "sign_up": "S'inscrire",
      "log_in": "Se Connecter",
      "dashboard": "Tableau de Bord",
      "pricing": "Tarification",
      "analytics": "Analyses",
      "orders": "Commandes",
      "settings": "Paramètres",
      "create_qr": "Créer un Code QR",
      "free": "GRATUIT",
      "standard": "STANDARD",
      "pro": "PRO",
      "features": "Fonctionnalités",
      "qr_codes": "Codes QR",
      "scans": "Numérisations",
      "analytics_dashboard": "Tableau de Bord d'Analyses"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
