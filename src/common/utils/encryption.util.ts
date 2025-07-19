import * as crypto from 'crypto';
import * as process from 'node:process';
import { ConfigModule } from '@nestjs/config';

const algorithm = 'aes-256-ctr';

function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(data: any): string {
  ConfigModule.envVariablesLoaded;
  const json = JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const key = deriveKey(process.env.SECRET);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): object {
  ConfigModule.envVariablesLoaded;
  const [ivString, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivString, 'hex');
  const key = deriveKey(process.env.SECRET);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}
