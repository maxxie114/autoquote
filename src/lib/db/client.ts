/**
 * DynamoDB Client
 *
 * Initializes and exports the DynamoDB Document Client for database operations.
 *
 * @module lib/db/client
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "@/lib/config/env";

/**
 * Base DynamoDB client with AWS credentials.
 */
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * DynamoDB Document Client for simplified document operations.
 * Configured to automatically remove undefined values from items.
 */
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    /** Remove undefined values from items before writing */
    removeUndefinedValues: true,
    /** Convert empty strings to null */
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    /** Wrap numbers in a special class to preserve precision */
    wrapNumbers: false,
  },
});
