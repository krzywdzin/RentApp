import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client;
  private bucket: string;
  private s3Available = false;
  private localStoragePath: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET', 'rentapp');
    this.localStoragePath = path.join(process.cwd(), '.local-storage');
    this.client = new S3Client({
      endpoint: this.config.get<string>(
        'S3_ENDPOINT',
        'http://localhost:9000',
      ),
      region: this.config.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucket }),
      );
      this.logger.log(`Bucket "${this.bucket}" exists`);
      this.s3Available = true;
    } catch (error: any) {
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        await this.client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
        this.logger.log(`Bucket "${this.bucket}" created`);
        this.s3Available = true;
      } else {
        this.logger.warn(`S3/MinIO unavailable — falling back to local filesystem storage`);
        await fs.mkdir(this.localStoragePath, { recursive: true });
      }
    }
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    if (this.s3Available) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } else {
      const filePath = path.join(this.localStoragePath, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, body);
    }
    return key;
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    if (this.s3Available) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return getSignedUrl(this.client, command, { expiresIn });
    }
    // Local fallback: serve via API
    return `/storage/${encodeURIComponent(key)}`;
  }

  async getBuffer(key: string): Promise<Buffer> {
    if (this.s3Available) {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      const stream = response.Body as NodeJS.ReadableStream;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }
    const filePath = path.join(this.localStoragePath, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    if (this.s3Available) {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } else {
      const filePath = path.join(this.localStoragePath, key);
      await fs.unlink(filePath).catch(() => {});
    }
  }
}
