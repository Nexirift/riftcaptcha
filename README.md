# RIFTCaptcha

A dead simple CAPTCHA service utilizing ALTCHA's Proof of Work (PoW).

This was created for use in [Pulsar](https://github.com/Nexirift/pulsar).

## Features

- Secure HMAC-based challenge generation
- Fast verification with Proof of Work
- Simple REST API
- Type-safe with TypeScript
- Highly customizable configuration
- Built-in rate limiting
- Configurable logging
- CORS support
- Challenge expiration
- Site key and secret key pair support

## Quick Start

**Recommended:** Just use our Docker image: `ghcr.io/nexirift/riftcaptcha:latest`, Docker Compose example [here](docker-compose.yml).

1. Install dependencies:
```bash
pnpm install
```

1. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

1. Run development server:
```bash
pnpm dev
```

## API Endpoints

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

### GET `/config`
Get current server configuration (sanitized).

**Response:**
```json
{
  "algorithm": "SHA-256",
  "maxNumber": 100000,
  "challengeExpiry": 300000,
  "rateLimitEnabled": false
}
```

### GET `/challenge`
Generate a new CAPTCHA challenge.

**Response:**
```json
{
  "algorithm": "SHA-256",
  "challenge": "...",
  "salt": "...",
  "signature": "...",
  "timestamp": "2026-01-04T12:00:00.000Z"
}
```

### POST `/verify`
Verify a CAPTCHA solution.

**Request:**
```json
{
  "payload": {
    "algorithm": "SHA-256",
    "challenge": "...",
    "number": 12345,
    "salt": "...",
    "signature": "..."
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "verified": true,
  "timestamp": "2026-01-04T12:00:00.000Z"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "verified": false
}
```

## Configuration

### Server Configuration

| Variable   | Description                                            | Default       |
| ---------- | ------------------------------------------------------ | ------------- |
| `PORT`     | Server port                                            | `3000`        |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |

### Security

| Variable   | Description                                 | Default      |
| ---------- | ------------------------------------------- | ------------ |
| `HMAC_KEY` | Secret key for HMAC (minimum 32 characters) | **Required** |

### Challenge Configuration

| Variable           | Description                                    | Default          |
| ------------------ | ---------------------------------------------- | ---------------- |
| `MAX_NUMBER`       | Maximum number for proof of work               | `100000`         |
| `SALT_LENGTH`      | Length of the salt string                      | `12`             |
| `ALGORITHM`        | Hash algorithm (`SHA-1`, `SHA-256`, `SHA-512`) | `SHA-256`        |
| `CHALLENGE_EXPIRY` | Challenge expiration time in milliseconds      | `300000` (5 min) |

### CORS Configuration

| Variable       | Description                              | Default                      |
| -------------- | ---------------------------------------- | ---------------------------- |
| `CORS_ENABLED` | Enable/disable CORS                      | `true`                       |
| `CORS_ORIGIN`  | Allowed origins (comma-separated or `*`) | `*`                          |
| `CORS_METHODS` | Allowed HTTP methods (comma-separated)   | `GET,POST,OPTIONS`           |
| `CORS_HEADERS` | Allowed headers (comma-separated)        | `Content-Type,Authorization` |

### Rate Limiting

| Variable                  | Description                  | Default         |
| ------------------------- | ---------------------------- | --------------- |
| `RATE_LIMIT_ENABLED`      | Enable/disable rate limiting | `false`         |
| `RATE_LIMIT_WINDOW_MS`    | Time window in milliseconds  | `60000` (1 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests per window  | `100`           |

### Response Customization

| Variable            | Description                     | Default |
| ------------------- | ------------------------------- | ------- |
| `INCLUDE_TIMESTAMP` | Include timestamp in responses  | `true`  |
| `VERBOSE_ERRORS`    | Include detailed error messages | `false` |

### Logging

| Variable            | Description                                              | Default |
| ------------------- | -------------------------------------------------------- | ------- |
| `LOG_LEVEL`         | Logging level (`none`, `error`, `warn`, `info`, `debug`) | `info`  |
| `LOG_CHALLENGES`    | Log challenge creation                                   | `false` |
| `LOG_VERIFICATIONS` | Log verification attempts                                | `false` |

## Example Configurations

### Production Setup
```env
NODE_ENV=production
HMAC_KEY=your-very-secure-randomly-generated-key-here
MAX_NUMBER=250000
ALGORITHM=SHA-512
CHALLENGE_EXPIRY=180000
CORS_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=50
VERBOSE_ERRORS=false
LOG_LEVEL=warn
```

### Development Setup
```env
NODE_ENV=development
HMAC_KEY=development-key-at-least-32-chars-long
MAX_NUMBER=50000
ALGORITHM=SHA-256
VERBOSE_ERRORS=true
LOG_LEVEL=debug
LOG_CHALLENGES=true
LOG_VERIFICATIONS=true
```

### High Security Setup
```env
MAX_NUMBER=500000
SALT_LENGTH=24
ALGORITHM=SHA-512
CHALLENGE_EXPIRY=120000
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

## Production Deployment

Build and run:
```bash
pnpm build
pnpm start
```

## Security Best Practices

- Always use a strong, randomly generated HMAC key (minimum 32 characters)
- Configure CORS appropriately for production environments
- Keep your HMAC key secret and never commit it to version control
- Enable rate limiting in production to prevent abuse
- Use HTTPS in production
- Set `VERBOSE_ERRORS=false` in production
- Use environment-specific `.env` files
- Regularly rotate your HMAC key
- Monitor logs for suspicious activity when `LOG_VERIFICATIONS=true`

## Performance Tuning

### Lower Difficulty (Faster, Less Secure)
```env
MAX_NUMBER=10000
ALGORITHM=SHA-1
```

### Higher Difficulty (Slower, More Secure)
```env
MAX_NUMBER=1000000
ALGORITHM=SHA-512
SALT_LENGTH=32
```

### Balanced (Recommended)
```env
MAX_NUMBER=100000
ALGORITHM=SHA-256
SALT_LENGTH=12
```
