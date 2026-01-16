/**
 * Calls Repository
 *
 * Data access layer for the Calls DynamoDB table.
 * Provides CRUD operations for call records.
 *
 * @module lib/db/calls
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
import type { Call, CreateCallInput, UpdateCallInput } from "@/lib/types/call";
import { NotFoundError } from "@/lib/utils/errors";

/** DynamoDB table name for calls */
const TABLE = env.DYNAMODB_TABLE_CALLS;

/**
 * Calls repository providing CRUD operations for call records.
 */
export const CallsRepository = {
  /**
   * Creates a new call record.
   *
   * @param call - Call data to create
   * @returns The created call
   * @throws Error if call already exists for this session/shop
   */
  async create(call: CreateCallInput): Promise<Call> {
    const fullCall: Call = {
      ...call,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: fullCall,
          ConditionExpression:
            "attribute_not_exists(session_id) AND attribute_not_exists(shop_id)",
        })
      );
      return fullCall;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new Error(
          `Call already exists for session ${call.session_id}, shop ${call.shop_id}`
        );
      }
      throw error;
    }
  },

  /**
   * Retrieves a call by session ID and shop ID.
   *
   * @param sessionId - Session ID
   * @param shopId - Shop ID
   * @returns The call if found, null otherwise
   */
  async get(sessionId: string, shopId: string): Promise<Call | null> {
    const result = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          session_id: sessionId,
          shop_id: shopId,
        },
      })
    );
    return (result.Item as Call) ?? null;
  },

  /**
   * Retrieves a call, throwing if not found.
   *
   * @param sessionId - Session ID
   * @param shopId - Shop ID
   * @returns The call
   * @throws NotFoundError if call doesn't exist
   */
  async getOrThrow(sessionId: string, shopId: string): Promise<Call> {
    const call = await this.get(sessionId, shopId);
    if (!call) {
      throw new NotFoundError("Call", `${sessionId}/${shopId}`);
    }
    return call;
  },

  /**
   * Updates fields on a call record.
   *
   * @param sessionId - Session ID
   * @param shopId - Shop ID
   * @param updates - Fields to update
   */
  async update(
    sessionId: string,
    shopId: string,
    updates: UpdateCallInput
  ): Promise<void> {
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {
      ":now": new Date().toISOString(),
    };

    // Build update expression dynamically
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== "session_id" && key !== "shop_id") {
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
        Key: {
          session_id: sessionId,
          shop_id: shopId,
        },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  },

  /**
   * Retrieves all calls for a session.
   *
   * @param sessionId - Session ID to query
   * @returns Array of calls for the session
   */
  async getBySession(sessionId: string): Promise<Call[]> {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "session_id = :sessionId",
        ExpressionAttributeValues: {
          ":sessionId": sessionId,
        },
      })
    );
    return (result.Items as Call[]) ?? [];
  },

  /**
   * Retrieves a call by Vapi call ID.
   *
   * @param vapiCallId - Vapi call identifier
   * @returns The call if found, null otherwise
   */
  async getByVapiCallId(vapiCallId: string): Promise<Call | null> {
    // Note: This requires a GSI on vapi_call_id for efficiency
    // For MVP, we use a scan with filter
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "vapi_call_id-index",
        KeyConditionExpression: "vapi_call_id = :vapiCallId",
        ExpressionAttributeValues: {
          ":vapiCallId": vapiCallId,
        },
        Limit: 1,
      })
    );
    return (result.Items?.[0] as Call) ?? null;
  },
};
