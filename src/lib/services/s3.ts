/**
 * S3 Media Service
 *
 * Provides S3 operations for media file uploads and retrieval.
 * Uses presigned URLs for secure client-side uploads.
 *
 * @module lib/services/s3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/config/env";
import { nanoid } from "nanoid";

/**
 * S3 client configured with AWS credentials.
 */
const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Result of generating a presigned upload URL.
 */
export type UploadUrlResult = {
  /** Presigned URL for uploading the file */
  uploadUrl: string;
  /** S3 key where the file will be stored */
  key: string;
};

/**
 * S3 service for media file operations.
 */
export const S3Service = {
  /**
   * Generates a presigned URL for uploading a file to S3.
   * The URL is valid for 1 hour.
   *
   * @param sessionId - Session ID to organize uploads by session
   * @param contentType - MIME type of the file being uploaded
   * @returns Object containing the upload URL and S3 key
   */
  async generateUploadUrl(
    sessionId: string,
    contentType: string
  ): Promise<UploadUrlResult> {
    // Extract extension from content type
    const extension = contentType.split("/")[1] || "jpg";
    const key = `uploads/${sessionId}/${nanoid()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_MEDIA,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return { uploadUrl, key };
  },

  /**
   * Generates a presigned URL for reading a file from S3.
   * The URL is valid for 1 hour.
   *
   * @param key - S3 key of the file to read
   * @returns Presigned URL for reading the file
   */
  async getSignedReadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_MEDIA,
      Key: key,
    });

    return getSignedUrl(s3, command, { expiresIn: 3600 });
  },

  /**
   * Constructs the public S3 URL for a file.
   * Note: This only works if the bucket has public read access configured.
   *
   * @param key - S3 key of the file
   * @returns Public URL for the file
   */
  getPublicUrl(key: string): string {
    return `https://${env.S3_BUCKET_MEDIA}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  },
};
