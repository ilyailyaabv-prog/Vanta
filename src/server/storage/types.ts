// ─────────────────────────────────────────────────────────────
// Vanta — Storage Abstraction Types
// ─────────────────────────────────────────────────────────────

/**
 * Storage providers supported by Vanta.
 * Currently only Cloudflare R2 is implemented.
 */
export type StorageProvider = "r2";

/**
 * Options for uploading a file to storage.
 */
export interface UploadOptions {
  /** Content-Type / MIME type of the file */
  contentType: string;
  /** Whether the file should be publicly readable (default: true) */
  isPublic?: boolean;
  /** Custom metadata to attach to the object */
  metadata?: Record<string, string>;
}

/**
 * Result returned after a successful upload.
 */
export interface UploadResult {
  /** The key under which the file was stored */
  key: string;
  /** Public URL of the stored file (if public) */
  publicUrl: string;
  /** Size of the stored file in bytes */
  size: number;
  /** Content-Type of the stored file */
  mimeType: string;
}

/**
 * Metadata about a stored file.
 */
export interface FileInfo {
  /** The storage key */
  key: string;
  /** Size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Last modified timestamp */
  lastModified: Date;
  /** ETag / hash of the file content */
  etag?: string;
  /** Whether the file exists */
  exists: boolean;
}

/**
 * Generic storage adapter interface.
 * All storage providers must implement this contract.
 */
export interface StorageAdapter {
  /**
   * Upload a file buffer to storage.
   */
  uploadFile(
    key: string,
    body: Buffer | Uint8Array | ReadableStream,
    options: UploadOptions,
  ): Promise<UploadResult>;

  /**
   * Delete a file from storage.
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Get the public URL for a stored file (if publicly accessible).
   */
  getPublicUrl(key: string): string;

  /**
   * Check if a file exists in storage and retrieve its metadata.
   */
  fileExists(key: string): Promise<FileInfo>;

  /**
   * Get the bucket name this adapter is configured for.
   */
  getBucketName(): string;

  /**
   * Get the storage provider name.
   */
  getProvider(): StorageProvider;
}