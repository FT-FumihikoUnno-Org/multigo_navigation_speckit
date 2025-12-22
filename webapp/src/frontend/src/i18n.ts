import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
const resources = {
  en: {
    translation: {
      "welcome": "Welcome to React",
      "login": "Login",
      "logout": "Logout",
      "dashboard": "Dashboard",
      "userManagement": "User Management",
      "loading": "Loading...",
      "loadingAuthentication": "Loading authentication...",
      "loginWithOpenID": "Login with OpenID",
      "welcomeToDashboard": "Welcome to your Dashboard, {{name}}!",
      "yourRole": "Your role: {{role}}",
      "userManagementPage": "User Management",
      "id": "ID",
      "displayName": "Display Name",
      "email": "Email",
      "role": "Role",
      "actions": "Actions",
      "administrator": "Administrator",
      "nurse": "Nurse",
      "caregiver": "Caregiver",
      "failedToFetchUsers": "Failed to fetch users",
      "errorConnectingToServer": "Error connecting to server",
      "errorLoadingUsers": "Error loading users",
      "invalidRoleName": "Invalid role name",
      "failedToUpdateRole": "Failed to update role",
      "userNotFound": "User not found or role not updated",
      "internalServerError": "Internal Server Error",
      "forbidden": "403 Forbidden",
    }
  },
  ja: {
    translation: {
      "welcome": "Reactへようこそ",
      "login": "ログイン",
      "logout": "ログアウト",
      "dashboard": "ダッシュボード",
      "userManagement": "ユーザー管理",
      "loading": "読み込み中...",
      "loadingAuthentication": "認証を読み込み中...",
      "loginWithOpenID": "OpenIDでログイン",
      "welcomeToDashboard": "ダッシュボードへようこそ、{{name}}さん！",
      "yourRole": "あなたの役割: {{role}}",
      "userManagementPage": "ユーザー管理",
      "id": "ID",
      "displayName": "表示名",
      "email": "メール",
      "role": "役割",
      "actions": "アクション",
      "administrator": "管理者",
      "nurse": "看護士",
      "caregiver": "介護士",
      "failedToFetchUsers": "ユーザーの取得に失敗しました",
      "errorConnectingToServer": "サーバーへの接続エラー",
      "errorLoadingUsers": "ユーザーの読み込みエラー",
      "invalidRoleName": "無効な役割名",
      "failedToUpdateRole": "役割の更新に失敗しました",
      "userNotFound": "ユーザーが見つからないか、役割が更新されませんでした",
      "internalServerError": "サーバー内部エラー",
      "forbidden": "403 禁止",
    }
  },
  zh: {
    translation: {
      "welcome": "欢迎使用 React",
      "login": "登录",
      "logout": "登出",
      "dashboard": "仪表板",
      "userManagement": "用户管理",
      "loading": "加载中...",
      "loadingAuthentication": "正在加载身份验证...",
      "loginWithOpenID": "使用 OpenID 登录",
      "welcomeToDashboard": "欢迎来到您的仪表板, {{name}}!",
      "yourRole": "您的角色: {{role}}",
      "userManagementPage": "用户管理",
      "id": "ID",
      "displayName": "显示名称",
      "email": "电子邮件",
      "role": "角色",
      "actions": "操作",
      "administrator": "管理员",
      "nurse": "护士",
      "caregiver": "护理员",
      "failedToFetchUsers": "获取用户失败",
      "errorConnectingToServer": "连接服务器错误",
      "errorLoadingUsers": "加载用户错误",
      "invalidRoleName": "无效的角色名称",
      "failedToUpdateRole": "更新角色失败",
      "userNotFound": "未找到用户或角色未更新",
      "internalServerError": "内部服务器错误",
      "forbidden": "403 禁止",
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
