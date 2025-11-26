import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/lib/session';
import { isFile } from '@/lib/type-guards';
import { logger } from '@/lib/logger';
import { prisma } from '@/server/db';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

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

    // Get form data
    const formData = await request.formData();
    const fileValue = formData.get('file');

    if (!isFile(fileValue)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const file = fileValue;

    // Validate file size BEFORE reading into memory (prevents DoS via large uploads)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate file type from header (basic check)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
        },
        { status: 400 }
      );
    }

    // Verify actual file content by checking magic bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const actualType = getFileTypeFromBuffer(buffer);

    if (!actualType || !ALLOWED_TYPES.includes(actualType)) {
      return NextResponse.json(
        { error: 'Invalid file content. File does not match declared type.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
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

    // Update user's avatar in database for ownership tracking
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: `/uploads/${uniqueFilename}` },
    });

    // Return public URL
    const publicUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      url: publicUrl,
      filename: uniqueFilename,
    });
  } catch (error) {
    logger.error({ error }, 'Avatar upload failed');
    return NextResponse.json(
      { error: 'Failed to upload avatar. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/avatar
 * Delete user avatar with ownership validation
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current avatar from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatar: true },
    });

    if (!user?.avatar) {
      return NextResponse.json({ error: 'No avatar to delete' }, { status: 404 });
    }

    // Extract filename from avatar URL
    const avatarPath = user.avatar;
    if (!avatarPath.startsWith('/uploads/')) {
      // External avatar (e.g., OAuth provider) - just clear the reference
      await prisma.user.update({
        where: { id: session.userId },
        data: { avatar: null },
      });
      return NextResponse.json({ success: true });
    }

    const filename = avatarPath.replace('/uploads/', '');
    
    // Validate filename format (UUID + extension)
    if (!/^[a-f0-9-]{36}\.[a-z]+$/i.test(filename)) {
      return NextResponse.json({ error: 'Invalid avatar path' }, { status: 400 });
    }

    // Delete file from filesystem
    const filePath = join(process.cwd(), 'public', 'uploads', filename);
    try {
      await unlink(filePath);
    } catch (err) {
      // File might not exist, log but continue
      logger.warn({ filename, error: err }, 'Avatar file not found during deletion');
    }

    // Clear avatar reference in database
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Avatar deletion failed');
    return NextResponse.json(
      { error: 'Failed to delete avatar. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Verify file type by checking magic bytes
 * Returns MIME type if valid image, null otherwise
 */
function getFileTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return 'image/png';
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}
