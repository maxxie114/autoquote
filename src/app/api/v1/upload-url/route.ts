/**
 * Upload URL API Route
 *
 * Generates presigned URLs for direct S3 uploads.
 * This is a simplified endpoint that doesn't require session context.
 *
 * @module app/api/v1/upload-url/route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { S3Service } from "@/lib/services/s3";
import { nanoid } from "nanoid";
import { z } from "zod";

/**
 * Request body schema.
 */
const uploadRequestSchema = z.object({
  contentType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, "Invalid image type"),
});

/**
 * POST /api/v1/upload-url
 *
 * Generates a presigned URL for uploading an image.
 * This endpoint is for generic uploads not tied to a session.
 *
 * Request body:
 * - contentType: string - MIME type (image/jpeg, image/png, etc.)
 *
 * Response:
 * - 200: { uploadUrl: string, key: string }
 * - 400: Invalid request
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

    // Generate a temporary session ID for organizing uploads
    const tempSessionId = `temp-${nanoid()}`;

    // Generate presigned upload URL
    const { uploadUrl, key } = await S3Service.generateUploadUrl(
      tempSessionId,
      contentType
    );

    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    console.error("[API] Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
