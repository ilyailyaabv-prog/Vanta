// ─────────────────────────────────────────────────────────────
// Vanta — Storage Module Barrel
// ─────────────────────────────────────────────────────────────

export { R2StorageAdapter, getStorageAdapter, resetStorageAdapter, isR2Configured } from "./r2";
export type {
  StorageAdapter,
  StorageProvider,
  UploadOptions,
  UploadResult,
  FileInfo,
} from "./types";