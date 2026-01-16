/**
 * Session Upload API Route
 *
 * Generates presigned URLs for uploading damage images.
 *
 * @module app/api/v1/sessions/[sessionId]/upload/route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { SessionsRepository } from "@/lib/db/sessions";
import { S3Service } from "@/lib/services/s3";
import { z } from "zod";

/**
 * Route context with session ID parameter.
 */
type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

/**
 * Request body schema.
 */
const uploadRequestSchema = z.object({
  contentType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, "Invalid image type"),
});

/**
 * POST /api/v1/sessions/:sessionId/upload
 *
 * Generates a presigned URL for uploading an image.
 *
 * Request body:
 * - contentType: string - MIME type (image/jpeg, image/png, etc.)
 *
 * Response:
 * - 200: { uploadUrl: string, key: string }
 * - 400: Invalid request
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Session not found
 * - 500: Server error
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    // Verify authentication using Auth0 SDK v4
    const authSession = await auth0.getSession();
    if (!authSession?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get session ID from params
    const { sessionId } = await context.params;

    // Fetch session
    const session = await SessionsRepository.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.user_id !== authSession.user.sub) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify session can accept uploads (only in CREATED status)
    if (session.status !== "CREATED") {
      return NextResponse.json(
        { error: "Cannot upload to session in progress" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = uploadRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid content type",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { contentType } = validationResult.data;

    // Generate presigned upload URL
    const { uploadUrl, key } = await S3Service.generateUploadUrl(
      sessionId,
      contentType
    );

    // Update session with new image key
    const existingKeys = session.image_keys || [];
    if (existingKeys.length >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 images allowed" },
        { status: 400 }
      );
    }

    await SessionsRepository.update(sessionId, {
      image_keys: [...existingKeys, key],
    });

    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    console.error("[API] Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
