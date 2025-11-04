/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STAGE?: string;
  readonly VITE_ATTENDANCE_API?: string;
  readonly VITE_GIVING_API?: string;
  readonly VITE_MEMBERSHIP_API?: string;
  readonly VITE_CONTENT_ROOT?: string;
  readonly VITE_B1_URL?: string;
  readonly VITE_GOOGLE_ANALYTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
