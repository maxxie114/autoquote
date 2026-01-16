/**
 * Sessions Collection API Route
 *
 * Handles session creation and listing.
 *
 * @module app/api/v1/sessions/route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { nanoid } from "nanoid";
import { z } from "zod";
import { SessionsRepository } from "@/lib/db/sessions";
import type { Session } from "@/lib/types/session";

/**
 * Zod schema for validating session creation requests.
 */
const createSessionSchema = z.object({
  location: z.string().min(1, "Location is required"),
  vehicle: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.number().int().min(1900).max(2100).optional(),
    })
    .optional(),
  description_raw: z
    .string()
    .min(10, "Please provide at least 10 characters describing the damage"),
  shops: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Invalid phone format"),
        address: z.string().optional(),
      })
    )
    .min(1, "At least one shop is required")
    .max(10, "Maximum 10 shops allowed"),
});

/**
 * POST /api/v1/sessions
 *
 * Creates a new quote session.
 *
 * Request body:
 * - location: string - User's location (ZIP/city)
 * - vehicle?: { make?: string, model?: string, year?: number }
 * - description_raw: string - Damage description (min 10 chars)
 * - shops: Array<{ id, name, phone, address? }> - 1-10 shops
 *
 * Response:
 * - 201: { session_id: string }
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication using Auth0 SDK v4
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // Create session object
    const quoteSession: Session = {
      session_id: nanoid(),
      user_id: session.user.sub as string,
      location: validated.location,
      vehicle: validated.vehicle,
      description_raw: validated.description_raw,
      shops: validated.shops,
      status: "CREATED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to DynamoDB
    await SessionsRepository.create(quoteSession);

    console.log(`[API] Session created: ${quoteSession.session_id} for user ${session.user.sub}`);

    return NextResponse.json(
      { session_id: quoteSession.session_id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Session creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/sessions
 *
 * Lists sessions for the authenticated user.
 *
 * Query parameters:
 * - limit?: number - Max sessions to return (default 50)
 *
 * Response:
 * - 200: Session[]
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication using Auth0 SDK v4
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Fetch sessions
    const sessions = await SessionsRepository.listByUser(
      session.user.sub as string,
      Math.min(limit, 100)
    );

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[API] Session list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
