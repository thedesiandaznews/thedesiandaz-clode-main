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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If running in Vercel or other serverless environment, use Base64 to bypass read-only filesystem
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return { success: true, url: dataUrl };
    }

    // Otherwise, try saving locally in development
    try {
      const folder = (formData.get('folder') as string) || 'epaper';
      const safeFolder = folder.replace(/[^a-zA-Z0-9_\-]/g, '');
      const uploadDir = join(process.cwd(), 'public', 'uploads', safeFolder);
      await mkdir(uploadDir, { recursive: true });
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const path = join(uploadDir, filename);
      await writeFile(path, buffer);
      return { success: true, url: `/uploads/${safeFolder}/${filename}` };
    } catch (fsError: any) {
      console.warn('Local filesystem write failed, falling back to Base64:', fsError.message);
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      return { success: true, url: `data:${mimeType};base64,${base64}` };
    }
  } catch (error: any) {
    console.error('Upload action error:', error);
    return { success: false, message: error.message || 'Upload failed' };
  }
}
