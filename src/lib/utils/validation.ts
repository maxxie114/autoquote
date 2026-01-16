/**
 * Validation Utilities
 *
 * Shared validation functions and schemas for the AutoQuote AI application.
 *
 * @module lib/utils/validation
 */

import { z } from "zod";

/**
 * Validates a phone number is in E.164 format.
 * E.164 format: +[country code][subscriber number]
 * Example: +15551234567
 */
export const phoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone number must be in E.164 format (e.g., +15551234567)");

/**
 * Validates a US ZIP code (5 digits or 5+4 format).
 */
export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format");

/**
 * Validates a session ID (nanoid format).
 */
export const sessionIdSchema = z
  .string()
  .min(1)
  .max(30);

/**
 * Schema for vehicle information.
 */
export const vehicleSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
});

/**
 * Schema for shop information.
 */
export const shopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: phoneNumberSchema,
  address: z.string().optional(),
});

/**
 * Schema for creating a new session.
 */
export const createSessionSchema = z.object({
  location: z.string().min(1, "Location is required"),
  vehicle: vehicleSchema.optional(),
  description_raw: z.string().min(10, "Please provide at least 10 characters describing the damage"),
  shops: z.array(shopSchema).min(1, "At least one shop is required").max(10, "Maximum 10 shops allowed"),
});

/**
 * Schema for damage severity.
 */
export const damageSeveritySchema = z.enum(["minor", "moderate", "severe"]);

/**
 * Schema for session status.
 */
export const sessionStatusSchema = z.enum([
  "CREATED",
  "ANALYZING",
  "CALLING",
  "SUMMARIZING",
  "DONE",
  "FAILED",
]);

/**
 * Schema for call status.
 */
export const callStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
]);

/**
 * Validates that a string is a valid ISO 8601 timestamp.
 */
export const isoTimestampSchema = z.string().datetime();

/**
 * Type inference helpers for exported schemas.
 */
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type ShopInput = z.infer<typeof shopSchema>;
