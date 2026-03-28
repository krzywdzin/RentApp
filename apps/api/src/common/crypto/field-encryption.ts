import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

const DEV_FALLBACK_KEY = '0'.repeat(64);
const EXAMPLE_PLACEHOLDER = 'a]bcd1234'; // partial match for .env.example placeholders

let devFallbackWarningLogged = false;

export interface EncryptedValue {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
}

function getKey(): Buffer {
  const keyHex = process.env.FIELD_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
    );
  }

  if (
    !devFallbackWarningLogged &&
    (keyHex === DEV_FALLBACK_KEY || keyHex.includes(EXAMPLE_PLACEHOLDER))
  ) {
    const logger = new Logger('FieldEncryption');
    logger.warn(
      'FIELD_ENCRYPTION_KEY is using a development fallback value. Set a secure key for production.',
    );
    devFallbackWarningLogged = true;
  }

  return Buffer.from(keyHex, 'hex');
}

export function encrypt(plaintext: string): EncryptedValue {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decrypt(encrypted: EncryptedValue): string {
  const key = getKey();
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hmacIndex(value: string): string {
  const key = getKey();
  return crypto.createHmac('sha256', key).update(value).digest('hex');
}
