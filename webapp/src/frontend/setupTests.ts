// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for test environment when missing
if (typeof global.TextEncoder === 'undefined') {
  // Use util from Node.js
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('util');
  // @ts-ignore
  global.TextEncoder = TextEncoder;
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

// Provide a safe global.fetch mock in the test environment to avoid network errors in AuthProvider
// Ensure a fetch is present in the test environment. We provide a jest mock directly to avoid external
// dependencies like node-fetch in the test environment.
if (typeof global.fetch === 'undefined') {
  // @ts-ignore
  global.fetch = undefined as any;
}
// Default jest-friendly mock for fetch to return 401 by default
if (!(typeof global.fetch === 'function' && (global.fetch as any).__isMock)) {
  // @ts-ignore
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
  // mark it to avoid double-wrapping
  // @ts-ignore
  (global.fetch as any).__isMock = true;
}

// Initialize i18n for tests so useTranslation() has an instance
// eslint-disable-next-line @typescript-eslint/no-var-requires
const i18n = require('i18next');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initReactI18next } = require('react-i18next');
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        dashboard: 'dashboard',
        login: 'login',
        logout: 'logout',
        userManagement: 'User Management',
        userManagementPage: 'User Management Page',
        id: 'id',
        displayName: 'displayName',
        email: 'email',
        role: 'role',
        actions: 'actions',
        administrator: 'Administrator',
        nurse: 'Nurse',
        caregiver: 'Caregiver',
        loadingUsers: 'Loading users...',
        failedToFetchUsers: 'Failed to fetch users',
        errorConnectingToServer: 'Error loading users',
        failedToUpdateRole: 'Failed to update role',
      },
    },
  },
  interpolation: { escapeValue: false },
});
