import { env } from '../env.js';

interface KeyPair {
    siteKey: string;
    secretKey: string;
}

export class KeyValidator {
    private keyPairs: KeyPair[] = [];

    constructor() {
        this.loadKeyPairs();
    }

    private loadKeyPairs(): void {
        if (!env.SITE_KEYS || !env.SECRET_KEYS) {
            return;
        }

        const siteKeys = env.SITE_KEYS.split(',').map((k: string) => k.trim());
        const secretKeys = env.SECRET_KEYS.split(',').map((k: string) => k.trim());

        if (siteKeys.length !== secretKeys.length) {
            throw new Error('Number of SITE_KEYS must match number of SECRET_KEYS');
        }

        this.keyPairs = siteKeys.map((siteKey: string, index: number) => ({
            siteKey,
            secretKey: secretKeys[index],
        }));
    }

    validateSiteKey(siteKey: string | undefined): boolean {
        if (!siteKey) return false;
        return this.keyPairs.some(pair => pair.siteKey === siteKey);
    }

    validateSecretKey(secretKey: string | undefined): boolean {
        if (!secretKey) return false;
        return this.keyPairs.some(pair => pair.secretKey === secretKey);
    }

    validateKeyPair(siteKey: string | undefined, secretKey: string | undefined): boolean {
        if (!siteKey || !secretKey) return false;
        return this.keyPairs.some(pair =>
            pair.siteKey === siteKey && pair.secretKey === secretKey
        );
    }

    hasKeys(): boolean {
        return this.keyPairs.length > 0;
    }
}

export const keyValidator = new KeyValidator();
