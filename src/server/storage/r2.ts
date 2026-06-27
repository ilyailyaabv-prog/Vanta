// ─────────────────────────────────────────────────────────────
// Vanta — Cloudflare R2 Storage Adapter
// ─────────────────────────────────────────────────────────────

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../../env";
import type {
  StorageAdapter,
  UploadOptions,
  UploadResult,
  FileInfo,
} from "./types";

/**
 * Cloudflare R2 storage adapter.
 *
 * R2 is S3-compatible, so we use the AWS SDK v3 S3 client
 * with the R2 endpoint.
 *
 * This adapter gracefully handles missing R2 configuration
 * by returning null from `getStorageAdapter()`.
 */
export class R2StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor() {
    const accountId = env.R2_ACCOUNT_ID!;
    const accessKeyId = env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY!;
    const bucket = env.R2_BUCKET_NAME!;
    const publicUrlBase = env.R2_PUBLIC_URL;

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    this.bucket = bucket;
    this.publicUrlBase = publicUrlBase ?? "";
  }

  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | ReadableStream,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body as never,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    const response = await this.client.send(command);

    return {
      key,
      publicUrl: this.getPublicUrl(key),
      size: body instanceof Buffer ? body.length : 0,
      mimeType: options.contentType,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  getPublicUrl(key: string): string {
    if (this.publicUrlBase) {
      const base = this.publicUrlBase.replace(/\/+$/, "");
      return `${base}/${key}`;
    }
    return `${this.getEndpoint()}/${this.bucket}/${key}`;
  }

  async fileExists(key: string): Promise<FileInfo> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength ?? 0,
        mimeType: response.ContentType ?? "application/octet-stream",
        lastModified: response.LastModified ?? new Date(0),
        etag: response.ETag?.replace(/"/g, ""),
        exists: true,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        return {
          key,
          size: 0,
          mimeType: "application/octet-stream",
          lastModified: new Date(0),
          exists: false,
        };
      }
      throw error;
    }
  }

  getBucketName(): string {
    return this.bucket;
  }

  getProvider(): "r2" {
    return "r2";
  }

  private getEndpoint(): string {
    const accountId = env.R2_ACCOUNT_ID!;
    return `https://${accountId}.r2.cloudflarestorage.com`;
  }
}

/** Check if R2 is configured */
export function isR2Configured(): boolean {
  return !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
}

let defaultAdapter: R2StorageAdapter | null = null;

/**
 * Get the default R2 storage adapter (singleton).
 * Returns null if R2 is not configured.
 */
export function getStorageAdapter(): R2StorageAdapter | null {
  if (!isR2Configured()) {
    return null;
  }
  if (!defaultAdapter) {
    defaultAdapter = new R2StorageAdapter();
  }
  return defaultAdapter;
}

export function resetStorageAdapter(): void {
  defaultAdapter = null;
}