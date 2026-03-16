import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ALLOW_PUBLIC_REGISTRATION: z.enum(["true", "false"]).default("false"),
  CORS_ORIGIN: z.string().default("*"),
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
  HTTP_LOGS: z.enum(["true", "false"]).default("false"),
  /** When "true" and NODE_ENV=development, no Bearer token is required; first org + first user are used. */
  SKIP_AUTH: z.enum(["true", "false"]).default("false"),
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
