import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createChallenge, verifySolution } from 'altcha-lib';
import { env } from './env.js';
import { logger } from './utils/logger.js';
import { rateLimiter } from './middleware/rateLimit.js';
import type { ChallengeResponse, VerifyResponse, HealthResponse, ErrorResponse } from './types.js';

const app = new Hono();

// Add CORS middleware (if enabled)
if (env.CORS_ENABLED) {
  app.use('/*', cors({
    origin: env.CORS_ORIGIN,
    allowMethods: env.CORS_METHODS.split(','),
    allowHeaders: env.CORS_HEADERS.split(','),
  }));
}

// Add rate limiting middleware
app.use('/*', rateLimiter);

// Health check endpoint
app.get('/health', (c) => {
  const response: HealthResponse = { status: 'ok' };
  return c.json(response);
});

// Get current configuration (sanitized)
app.get('/config', (c) => {
  const config = {
    algorithm: env.ALGORITHM,
    maxNumber: env.MAX_NUMBER,
    challengeExpiry: env.CHALLENGE_EXPIRY,
    rateLimitEnabled: env.RATE_LIMIT_ENABLED,
    ...(env.RATE_LIMIT_ENABLED && {
      rateLimitWindow: env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    }),
  };
  return c.json(config);
});

app.get('/challenge', async (c) => {
  try {
    const challenge = await createChallenge({
      hmacKey: env.HMAC_KEY,
      maxNumber: env.MAX_NUMBER,
      saltLength: env.SALT_LENGTH,
      algorithm: env.ALGORITHM,
      expires: new Date(Date.now() + env.CHALLENGE_EXPIRY),
    });

    if (env.LOG_CHALLENGES) {
      logger.debug('Challenge created', {
        challenge: challenge.challenge,
        algorithm: env.ALGORITHM
      });
    }

    const response: ChallengeResponse & { timestamp?: string } = {
      ...challenge,
      ...(env.INCLUDE_TIMESTAMP && { timestamp: new Date().toISOString() }),
    };

    return c.json(response);
  } catch (error) {
    logger.error('Error creating challenge:', error);

    const errorResponse: ErrorResponse = {
      error: env.VERBOSE_ERRORS && error instanceof Error
        ? error.message
        : 'Failed to create challenge'
    };

    return c.json(errorResponse, 500);
  }
});

app.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const payload = body.payload ?? body;

    if (!payload) {
      const response: VerifyResponse = {
        success: false,
        verified: false,
        error: 'Missing payload',
      };
      return c.json(response, 400);
    }

    const verified = await verifySolution(payload, env.HMAC_KEY, true);

    if (env.LOG_VERIFICATIONS) {
      logger.info('Verification attempt', { verified, ip: c.req.header('x-forwarded-for') });
    }

    const response: VerifyResponse & { timestamp?: string } = {
      success: verified,
      verified,
      ...(env.INCLUDE_TIMESTAMP && { timestamp: new Date().toISOString() }),
    };

    return c.json(response, verified ? 200 : 400);
  } catch (error) {
    logger.error('Error verifying solution:', error);

    const errorResponse: VerifyResponse = {
      success: false,
      verified: false,
      error: env.VERBOSE_ERRORS && error instanceof Error
        ? error.message
        : 'Verification failed',
    };

    return c.json(errorResponse, 500);
  }
});

serve({
  fetch: app.fetch,
  port: env.PORT,
}, (info) => {
  logger.info('RIFTCAPTCHA: Dead simple CAPTCHA');
  logger.info(`Server is running on http://localhost:${info.port}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Algorithm: ${env.ALGORITHM}`);
  logger.info(`Max Number: ${env.MAX_NUMBER}`);
  logger.info(`Challenge Expiry: ${env.CHALLENGE_EXPIRY}ms`);
  logger.info(`CORS: ${env.CORS_ENABLED ? 'Enabled' : 'Disabled'}`);
  logger.info(`Rate Limiting: ${env.RATE_LIMIT_ENABLED ? 'Enabled' : 'Disabled'}`);
});
