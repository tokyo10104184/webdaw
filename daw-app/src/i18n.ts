import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// the translations
const resources = {
  en: {
    translation: {
      // General
      "Language": "Language",
      "Settings": "Settings",
      "Switch": "Switch",
      "Done": "Done",

      // ProjectMenu
      "Project Name": "Project Name",
      "Save Project": "Save Project",
      "New Project": "New Project",
      "Recent Projects": "Recent Projects",
      "No saved projects found": "No saved projects found",
      "MiniDAW": "MiniDAW",

      // App
      "Please Rotate Your Device": "Please Rotate Your Device",
      "landscape_msg": "This application is designed to be used in landscape mode for the best experience."
    }
  },
  ja: {
    translation: {
      // General
      "Language": "言語",
      "Settings": "設定",
      "Switch": "切り替え",
      "Done": "完了",

      // ProjectMenu
      "Project Name": "プロジェクト名",
      "Save Project": "プロジェクトを保存",
      "New Project": "新規プロジェクト",
      "Recent Projects": "最近のプロジェクト",
      "No saved projects found": "保存されたプロジェクトが見つかりません",
      "MiniDAW": "MiniDAW",

      // App
      "Please Rotate Your Device": "デバイスを回転させてください",
      "landscape_msg": "このアプリケーションは横画面で使用するように設計されています。"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    // Always fallback to JA as requested for default language
    // By default LanguageDetector detects language from browser.
    // If we want to strictly start with JA unless a user choice is in localStorage:
    // we let it run, but if not set in localstorage, fallback is JA.
    lng: localStorage.getItem('i18nextLng') || 'ja',
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
