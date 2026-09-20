import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(2001),
  MONGODB_URI: z.string().url(),
  // Single URL or comma-separated allowlist
  // (e.g. "https://dev-arena-plum.vercel.app,http://localhost:5173").
  // The first entry is the primary OAuth redirect target.
  FRONTEND_URL: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value
          .split(",")
          .map((url) => url.trim())
          .filter(Boolean)
          .every((url) => {
            try {
              const parsed = new URL(url);
              return parsed.protocol === "http:" || parsed.protocol === "https:";
            } catch {
              return false;
            }
          }),
      { message: "FRONTEND_URL must be a URL or comma-separated URLs" },
    ),
  SESSION_SECRET: z.string().min(32),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  JUDGE0_API_URL: z.string().url().default("https://ce.judge0.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;