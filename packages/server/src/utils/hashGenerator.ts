import crypto from 'crypto';

/**
 * Generate a random short hash ID
 * e.g. "x9f3a2"
 */
export const generateHashId = (length: number = 6): string => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};
