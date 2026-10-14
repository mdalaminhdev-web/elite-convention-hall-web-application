import { getPool } from '../../config/database.js';

function imageUrl(key,admin = false) {
  if (!key || !/^gallery\/[0-9a-f-]{36}\.webp$/i.test(key)) return null;
  return admin ? `/api/v1/admin/gallery/media/${key.slice(8)}` : `/media/${key}`;
}
function albumRow(r,admin = false) {
  return { id: String(r.id), slug: r.slug, title: r.title, description: r.description ?? '', coverMediaId: r.cover_media_id == null ? null : String(r.cover_media_id), coverUrl: imageUrl(r.cover_key,admin), featured: !!r.is_featured, published: !!r.is_published, sortOrder: Number(r.sort_order), photoCount: Number(r.photo_count ?? 0), createdAt: r.created_at };
}
function photoRow(r,admin = false) {
  return { id: String(r.id), albumId: String(r.album_id), mediaId: String(r.media_id), url: imageUrl(r.storage_key,admin), caption: r.caption ?? '', altText: r.alt_text ?? r.default_alt_text ?? '', sortOrder: Number(r.sort_order), published: !!r.is_published };
}
const albumSelect = `SELECT a.*, m.storage_key AS cover_key,
  (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id AND p.is_published = 1) AS photo_count
  FROM gallery_albums a LEFT JOIN media_assets m ON m.id = a.cover_media_id`;

export const galleryRepository = {
  async listPublic({ featured = false } = {}) {
    const sql = `${albumSelect} WHERE a.is_published = 1 ${featured ? 'AND a.is_featured = 1' : ''} ORDER BY a.sort_order ASC, a.id DESC`;
    const [rows] = await getPool().query(sql);
    return rows.map(albumRow);
  },
  async publicAlbum(slug) {
    const [rows] = await getPool().execute(`${albumSelect} WHERE a.is_published = 1 AND a.slug = ? LIMIT 1`, [slug]);
    if (!rows.length) return null;
    const album = albumRow(rows[0]);
    const [photos] = await getPool().execute(`SELECT p.*, m.storage_key, m.default_alt_text FROM gallery_photos p
      INNER JOIN media_assets m ON m.id = p.media_id WHERE p.album_id = ? AND p.is_published = 1 ORDER BY p.sort_order ASC, p.id ASC`, [album.id]);
    return { album, photos: photos.map(photoRow) };
  },
  async listAdmin() {
    const [rows] = await getPool().query(`${albumSelect} ORDER BY a.sort_order ASC, a.id DESC`);
    return rows.map(r => albumRow(r,true));
  },
  async adminAlbum(id) {
    const [rows] = await getPool().execute(`${albumSelect} WHERE a.id = ? LIMIT 1`, [id]);
    if (!rows.length) return null;
    const [photos] = await getPool().execute(`SELECT p.*, m.storage_key, m.default_alt_text FROM gallery_photos p
      INNER JOIN media_assets m ON m.id = p.media_id WHERE p.album_id = ? ORDER BY p.sort_order ASC, p.id ASC`, [id]);
    return { album: albumRow(rows[0],true), photos: photos.map(r=>photoRow(r,true)) };
  },
  async isPublicImageKey(key) {
    const [rows] = await getPool().execute(`SELECT (
      EXISTS(SELECT 1 FROM gallery_albums a INNER JOIN media_assets m ON m.id=a.cover_media_id
        WHERE a.is_published=1 AND m.storage_key=?) OR
      EXISTS(SELECT 1 FROM gallery_photos p INNER JOIN gallery_albums a ON a.id=p.album_id
        INNER JOIN media_assets m ON m.id=p.media_id
        WHERE a.is_published=1 AND p.is_published=1 AND m.storage_key=?)
    ) AS visible`, [key,key]);
    return Number(rows[0]?.visible) === 1;
  },
  async isGalleryMedia(id) {
    const [rows] = await getPool().execute(`SELECT id FROM media_assets WHERE id = ? AND storage_driver = 'LOCAL' AND storage_key LIKE 'gallery/%' LIMIT 1`, [id]);
    return rows.length > 0;
  },
  async createAlbum(a) {
    const [result] = await getPool().execute(`INSERT INTO gallery_albums (slug,title,description,is_featured,is_published,sort_order,cover_media_id)
      VALUES (?,?,?,?,?,?,?)`, [a.slug,a.title,a.description,a.featured?1:0,a.published?1:0,a.sortOrder,a.coverMediaId]);
    return String(result.insertId);
  },
  async updateAlbum(id, a) {
    const [result] = await getPool().execute(`UPDATE gallery_albums SET slug=?,title=?,description=?,is_featured=?,is_published=?,sort_order=?,cover_media_id=? WHERE id=?`,
      [a.slug,a.title,a.description,a.featured?1:0,a.published?1:0,a.sortOrder,a.coverMediaId,id]);
    return result.affectedRows > 0;
  },
  async deleteAlbum(id) {
    const [r] = await getPool().execute('DELETE FROM gallery_albums WHERE id = ?', [id]);
    return r.affectedRows > 0;
  },
  async insertMedia({ key, filename, bytes, width, height, altText, adminId }) {
    const [r] = await getPool().execute(`INSERT INTO media_assets(storage_driver,storage_key,original_filename,mime_type,size_bytes,width_px,height_px,default_alt_text,uploaded_by)
      VALUES('LOCAL',?,?,'image/webp',?,?,?,?,?)`, [key,filename,bytes,width,height,altText,adminId]);
    return String(r.insertId);
  },
  async addPhoto(albumId, data) {
    const [r] = await getPool().execute(`INSERT INTO gallery_photos(album_id,media_id,caption,alt_text,sort_order,is_published)
      VALUES(?,?,?,?,(SELECT COALESCE(MAX(p.sort_order),-1)+1 FROM (SELECT sort_order FROM gallery_photos WHERE album_id = ?) p),?)`,
      [albumId,data.mediaId,data.caption,data.altText,albumId,data.published?1:0]);
    return String(r.insertId);
  },
  async updatePhoto(albumId, photoId, p) {
    const [r] = await getPool().execute(`UPDATE gallery_photos SET media_id=?,caption=?,alt_text=?,is_published=? WHERE album_id=? AND id=?`,
      [p.mediaId,p.caption,p.altText,p.published?1:0,albumId,photoId]);
    return r.affectedRows > 0;
  },
  async deletePhoto(albumId, photoId) {
    const [r] = await getPool().execute('DELETE FROM gallery_photos WHERE album_id=? AND id=?', [albumId, photoId]);
    return r.affectedRows > 0;
  },
  async reorderPhotos(albumId, photoIds) {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute('SELECT id FROM gallery_photos WHERE album_id=? FOR UPDATE', [albumId]);
      const current = new Set(existing.map(r=>String(r.id)));
      if (existing.length !== photoIds.length || new Set(photoIds).size !== photoIds.length || !photoIds.every(id=>current.has(String(id)))) {
        await connection.rollback(); return false;
      }
      for (let index=0; index<photoIds.length; index++) {
        await connection.execute('UPDATE gallery_photos SET sort_order=? WHERE album_id=? AND id=?', [index, albumId, photoIds[index]]);
      }
      await connection.commit(); return true;
    } catch (e) { await connection.rollback(); throw e; }
    finally { connection.release(); }
  },
};
