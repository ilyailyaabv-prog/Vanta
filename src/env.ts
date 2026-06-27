import { z } from "zod";

const envSchema = z.object({
  /* Database */
  DATABASE_URL: z.string().url(),

  /* NextAuth */
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  /* Cloudflare R2 */
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  /* Redis */
  REDIS_URL: z.string().optional(),

  /* Application */
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_THEME: z.enum(["dark", "light"]).optional(),

  /* Video Upload */
  MAX_VIDEO_UPLOAD_SIZE: z.coerce.number().default(500), // MB
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
        .join("\n");
      console.warn(
        `[vanta/env] Environment variable validation warnings:\n${missing}`,
      );
    }
    return process.env as unknown as Env;
  }
}

export const env = validateEnv();