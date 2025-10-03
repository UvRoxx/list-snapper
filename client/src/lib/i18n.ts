import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files directly
import enCommon from '../../public/locales/en/common.json';
import frCommon from '../../public/locales/fr/common.json';

const resources = {
  en: {
    common: enCommon
  },
  fr: {
    common: frCommon
  }
};

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
