import { z } from "zod";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required")
    .startsWith("sk-", "ANTHROPIC_API_KEY must start with 'sk-'"),
  PORT: z
    .string()
    .default("3001")
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535)),
  BATCH_SIZE: z
    .string()
    .default("20")
    .transform(Number)
    .pipe(z.number().int().min(1).max(100)),
  BATCH_CONCURRENCY: z
    .string()
    .default("3")
    .transform(Number)
    .pipe(z.number().int().min(1).max(10)),
  MAX_UPLOAD_MB: z
    .string()
    .default("5")
    .transform(Number)
    .pipe(z.number().min(0.1).max(50)),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(formatted, null, 2));
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
