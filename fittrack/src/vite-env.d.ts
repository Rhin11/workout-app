/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USDA_API_KEY: string;
  readonly VITE_EXERCISEDB_BASE?: string;
  readonly VITE_EXERCISEDB_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
