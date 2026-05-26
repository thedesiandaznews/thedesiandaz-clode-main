'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function uploadImage(formData: FormData) {
  return uploadFileAction(formData);
}

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') || formData.get('image');
    if (!file || !(file instanceof File)) {
      return { success: false, message: 'No file provided' };
    }

    const folder = (formData.get('folder') as string) || 'epaper';
    
    // Sanitize folder to prevent path traversal
    const safeFolder = folder.replace(/[^a-zA-Z0-9_\-]/g, '');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads', safeFolder);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const path = join(uploadDir, filename);

    await writeFile(path, buffer);
    const publicUrl = `/uploads/${safeFolder}/${filename}`;

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload action error:', error);
    return { success: false, message: error.message || 'Upload failed' };
  }
}
