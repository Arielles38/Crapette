/**
 * i18next configuration for localization
 */

import i18next from 'i18next';
import enLocale from '../locales/en.json';
import frLocale from '../locales/fr.json';

i18next.init({
  interpolation: { escapeValue: false },
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: enLocale },
    fr: { translation: frLocale },
  },
});

export default i18next;

export const getLanguage = (): string => i18next.language;

export const setLanguage = async (lang: string): Promise<void> => {
  await i18next.changeLanguage(lang);
};

export const t = (key: string, options?: any): string => {
  const result = i18next.t(key, options);
  return typeof result === 'string' ? result : key;
};
