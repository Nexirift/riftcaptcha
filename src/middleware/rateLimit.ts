import type { Context, Next } from 'hono';
import { env } from '../env.js';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);

export const rateLimiter = async (c: Context, next: Next) => {
    if (!env.RATE_LIMIT_ENABLED) {
        return next();
    }

    // Use IP address or a header as identifier
    const identifier = c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown';

    const now = Date.now();
    const record = store[identifier];

    if (!record || record.resetTime < now) {
        store[identifier] = {
            count: 1,
            resetTime: now + env.RATE_LIMIT_WINDOW_MS,
        };
        return next();
    }

    if (record.count >= env.RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return c.json(
            {
                error: 'Too many requests',
                retryAfter,
            },
            429,
            {
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': env.RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
            }
        );
    }

    record.count++;

    c.header('X-RateLimit-Limit', env.RATE_LIMIT_MAX_REQUESTS.toString());
    c.header('X-RateLimit-Remaining', (env.RATE_LIMIT_MAX_REQUESTS - record.count).toString());
    c.header('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    return next();
};
