import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'; // For loading translations from server/files

// Ensure these are the correct paths based on your project structure
import enTranslation from './locales/en/translation.json';
import jaTranslation from './locales/ja/translation.json';
import zhTranslation from './locales/zh/translation.json';

const defaultNS = 'translation'; // Default namespace

i18n
  // load translation using http backend
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // pass the i18next instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: 'en', // Fallback language
    lng: 'en', // Default language to be used
    ns: ['translation'], // Namespaces
    defaultNS,

    resources: {
      en: {
        translation: enTranslation,
      },
      ja: {
        translation: jaTranslation,
      },
      zh: {
        translation: zhTranslation,
      },
    },

    interpolation: {
      escapeValue: false, // react already safes from xss
    },

    react: {
      useSuspense: false, // Set to false if you don't want to use Suspense
    },
  });

export default i18n;
