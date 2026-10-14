import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import sharp from 'sharp';

// Absolute storage path. Never accept a directory or storage key from the client.
export const MEDIA_DIRECTORY = resolve(process.env.MEDIA_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../../../uploads'));
export const galleryDiskDirectory = join(MEDIA_DIRECTORY, 'gallery');
export const galleryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_req,file,cb) { cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype)); },
}).single('image');

export const galleryMediaService = {
  async create({ file, adminId, altText, repository }) {
    if (!file?.buffer) { const e = new Error('Provide one supported JPG, PNG or WebP image under 8 MB'); e.status = 400; throw e; }
    let metadata, buffer;
    try {
      const input = sharp(file.buffer, { limitInputPixels: 30_000_000, animated: false, failOn: 'error' });
      metadata = await input.metadata();
      if (!['jpeg','png','webp'].includes(metadata.format) || !metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000 || (metadata.pages ?? 1) > 1) throw new Error('Unsupported image');
      // Image decoding/re-encoding strips untrusted embedded metadata and executable payloads.
      buffer = await input.rotate().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
      metadata = await sharp(buffer).metadata();
    } catch { const e = new Error('The uploaded image is invalid or not supported'); e.status=400; throw e; }
    const key = `gallery/${randomUUID()}.webp`;
    const path = join(MEDIA_DIRECTORY,key);
    await mkdir(galleryDiskDirectory,{ recursive:true });
    await writeFile(path,buffer,{flag:'wx'});
    try {
      const id = await repository.insertMedia({ key, filename: file.originalname.slice(0,255), bytes:buffer.length, width:metadata.width, height:metadata.height, altText, adminId });
      return { id, url:`/api/v1/admin/gallery/media/${key.slice(8)}`, width:metadata.width, height:metadata.height };
    } catch (e) { await unlink(path).catch(()=>{}); throw e; }
  },
};
