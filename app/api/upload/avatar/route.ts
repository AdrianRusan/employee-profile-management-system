import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/lib/session';
import { isFile } from '@/lib/type-guards';
import { validateCsrfFromRequest } from '@/lib/csrf';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// Magic bytes (file signatures) for image validation
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/jpg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF at start
};

/**
 * Validate file content by checking magic bytes
 */
function validateFileMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some((signature) =>
    signature.every((byte, index) => buffer[index] === byte)
  );
}

/**
 * POST /api/upload/avatar
 * Upload user avatar image
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate CSRF token
    const isValidCsrf = await validateCsrfFromRequest(request);
    if (!isValidCsrf) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const fileValue = formData.get('file');

    if (!isFile(fileValue)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const file = fileValue;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Read file content for validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file content (magic bytes)
    if (!validateFileMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file content. The file does not match its declared type.',
        },
        { status: 400 }
      );
    }

    // Generate unique filename with sanitized extension
    const fileExtension = file.type.split('/')[1];
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }

    // Save file
    const filePath = join(uploadsDir, uniqueFilename);
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      url: publicUrl,
      filename: uniqueFilename,
    });
  } catch (error) {
    logger.error({ error }, 'Avatar upload error');
    return NextResponse.json(
      { error: 'Failed to upload avatar. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/avatar
 * Delete user avatar (optional cleanup endpoint)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate CSRF token
    const isValidCsrf = await validateCsrfFromRequest(request);
    if (!isValidCsrf) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    // Note: For production, implement actual file deletion and validation
    // that the user owns this avatar

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Avatar deletion error');
    return NextResponse.json(
      { error: 'Failed to delete avatar. Please try again.' },
      { status: 500 }
    );
  }
}
