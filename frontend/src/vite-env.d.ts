/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MEDIA_URL: string;
  readonly VITE_GA_ID?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
