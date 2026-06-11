/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MEDIA_URL: string;
  readonly VITE_GA_ID?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_ENABLE_WEBP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module 'pannellum-react';  
 