export interface ChallengeResponse {
    algorithm: string;
    challenge: string;
    salt: string;
    signature: string;
}

export interface VerifyRequest {
    payload: string | {
        algorithm: string;
        challenge: string;
        number: number;
        salt: string;
        signature: string;
    };
}

export interface VerifyResponse {
    success: boolean;
    verified: boolean;
    error?: string;
}

export interface HealthResponse {
    status: 'ok';
}

export interface ErrorResponse {
    error: string;
}
