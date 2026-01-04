import { createEnv } from "@t3-oss/env-core";
import { configDotenv } from "dotenv";
import { z } from "zod";

configDotenv({
    quiet: true,
});

export const env = createEnv({
    server: {
        // Server Configuration
        PORT: z.coerce.number().min(1).max(65535).default(3000),
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
        REDIRECT_INDEX: z.url().optional(),

        // Security
        HMAC_KEY: z.string().min(32, "HMAC key should be at least 32 characters"),
        SITE_KEYS: z.string().min(1, "Site keys are required (comma-separated)").optional(),
        SECRET_KEYS: z.string().min(1, "Secret keys are required (comma-separated)").optional(),
        REQUIRE_KEYS: z.coerce.boolean().default(false),

        // Challenge Configuration
        MAX_NUMBER: z.coerce.number().positive().default(100000),
        SALT_LENGTH: z.coerce.number().positive().default(12),
        ALGORITHM: z.enum(['SHA-1', 'SHA-256', 'SHA-512']).default('SHA-256'),
        CHALLENGE_EXPIRY: z.coerce.number().positive().default(300000), // 5 minutes in ms

        // CORS Configuration
        CORS_ENABLED: z.coerce.boolean().default(true),
        CORS_ORIGIN: z.string().default('*'),
        CORS_METHODS: z.string().default('GET,POST,OPTIONS'),
        CORS_HEADERS: z.string().default('Content-Type,Authorization'),

        // Rate Limiting (requests per window)
        RATE_LIMIT_ENABLED: z.coerce.boolean().default(false),
        RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60000), // 1 minute
        RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),

        // Response Customization
        INCLUDE_TIMESTAMP: z.coerce.boolean().default(true),
        VERBOSE_ERRORS: z.coerce.boolean().default(false),

        // Logging
        LOG_LEVEL: z.enum(['none', 'error', 'warn', 'info', 'debug']).default('info'),
        LOG_CHALLENGES: z.coerce.boolean().default(false),
        LOG_VERIFICATIONS: z.coerce.boolean().default(false),
    },

    /**
     * What object holds the environment variables at runtime. This is usually
     * `process.env` or `import.meta.env`.
     */
    runtimeEnv: process.env,

    /**
     * By default, this library will feed the environment variables directly to
     * the Zod validator.
     *
     * This means that if you have an empty string for a value that is supposed
     * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
     * it as a type mismatch violation. Additionally, if you have an empty string
     * for a value that is supposed to be a string with a default value (e.g.
     * `DOMAIN=` in an ".env" file), the default value will never be applied.
     *
     * In order to solve these issues, we recommend that all new projects
     * explicitly specify this option as true.
     */
    emptyStringAsUndefined: true,
});