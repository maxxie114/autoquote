/**
 * Sessions Repository
 *
 * Data access layer for the Sessions DynamoDB table.
 * Provides CRUD operations for session records.
 *
 * @module lib/db/sessions
 */

import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { ddb } from "./client";
import { env } from "@/lib/config/env";
import type { Session, SessionStatus } from "@/lib/types/session";
import { NotFoundError } from "@/lib/utils/errors";

/** DynamoDB table name for sessions */
const TABLE = env.DYNAMODB_TABLE_SESSIONS;

/**
 * Sessions repository providing CRUD operations for session records.
 */
export const SessionsRepository = {
  /**
   * Creates a new session record.
   * Uses conditional write to prevent accidental overwrites.
   *
   * @param session - Session data to create
   * @returns The created session
   * @throws Error if session_id already exists
   */
  async create(session: Session): Promise<Session> {
    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: session,
          ConditionExpression: "attribute_not_exists(session_id)",
        })
      );
      return session;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new Error(`Session already exists: ${session.session_id}`);
      }
      throw error;
    }
  },

  /**
   * Retrieves a session by ID.
   *
   * @param sessionId - Session ID to retrieve
   * @returns The session if found, null otherwise
   */
  async get(sessionId: string): Promise<Session | null> {
    const result = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { session_id: sessionId },
      })
    );
    return (result.Item as Session) ?? null;
  },

  /**
   * Retrieves a session by ID, throwing if not found.
   *
   * @param sessionId - Session ID to retrieve
   * @returns The session
   * @throws NotFoundError if session doesn't exist
   */
  async getOrThrow(sessionId: string): Promise<Session> {
    const session = await this.get(sessionId);
    if (!session) {
      throw new NotFoundError("Session", sessionId);
    }
    return session;
  },

  /**
   * Updates the session status.
   *
   * @param sessionId - Session ID to update
   * @param status - New status value
   */
  async updateStatus(sessionId: string, status: SessionStatus): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { session_id: sessionId },
        UpdateExpression: "SET #status = :status, updated_at = :now",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":status": status,
          ":now": new Date().toISOString(),
        },
      })
    );
  },

  /**
   * Updates arbitrary fields on a session.
   *
   * @param sessionId - Session ID to update
   * @param updates - Partial session object with fields to update
   */
  async update(sessionId: string, updates: Partial<Session>): Promise<void> {
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {
      ":now": new Date().toISOString(),
    };

    // Build update expression dynamically
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== "session_id") {
        const placeholder = `:${key}`;
        const namePlaceholder = `#${key}`;
        expressions.push(`${namePlaceholder} = ${placeholder}`);
        names[namePlaceholder] = key;
        values[placeholder] = value;
      }
    });

    // Always update updated_at
    expressions.push("updated_at = :now");

    if (expressions.length === 1) {
      // Only updated_at, nothing to update
      return;
    }

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { session_id: sessionId },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  },

  /**
   * Lists sessions for a user.
   *
   * @param userId - User ID to filter by
   * @param limit - Maximum number of sessions to return
   * @returns Array of sessions
   */
  async listByUser(userId: string, limit = 50): Promise<Session[]> {
    // Note: This requires a GSI on user_id for efficiency
    // For MVP, we use a scan with filter (not recommended for production at scale)
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "user_id-index",
        KeyConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        Limit: limit,
        ScanIndexForward: false, // Most recent first
      })
    );
    return (result.Items as Session[]) ?? [];
  },
};
