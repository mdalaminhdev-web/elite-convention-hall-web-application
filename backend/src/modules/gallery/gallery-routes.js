import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { galleryUpload, galleryMediaService, galleryDiskDirectory } from './gallery-media.js';
import { join } from 'node:path';

const idSchema = z.coerce.string().regex(/^[1-9]\d{0,18}$/);
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);
const trim = max => z.string().trim().max(max);
const albumSchema = z.object({
  slug: slugSchema, title:z.string().trim().min(1).max(255), description:trim(10000).default(''),
  featured:z.boolean().default(false), published:z.boolean().default(false), sortOrder:z.number().int().min(0).max(1000000).default(0),
  coverMediaId:idSchema.nullable().default(null),
}).strict();
const photoSchema = z.object({mediaId:idSchema, caption:trim(500).default(''),altText:trim(500).default(''),published:z.boolean().default(true)}).strict();
const photoUpdate = photoSchema.partial().strict();
const error = (res, status, code, message) => res.status(status).json({error:{code,message}});
const asyncRoute = handler => (req,res,next) => Promise.resolve(handler(req,res,next)).catch(next);
const checkId = (res,v) => {
  const r=idSchema.safeParse(v); if (!r.success) {error(res,400,'VALIDATION_ERROR','Invalid identifier');return null;} return r.data;
};
const checkData = (res,schema,body) => {
  const r=schema.safeParse(body); if (!r.success) {error(res,400,'VALIDATION_ERROR',r.error.issues[0]?.message || 'Invalid fields'); return null;} return r.data;
};
const existsMedia = async (repo,data) => data.coverMediaId === null || repo.isGalleryMedia(data.coverMediaId);
const normalizeDbErrors=(err,res,next)=>{
  if(err?.code==='ER_DUP_ENTRY')return error(res,409,'DUPLICATE_SLUG','The album slug already exists');
  if(err?.code==='ER_NO_REFERENCED_ROW_2')return error(res,400,'INVALID_REFERENCE','Invalid referenced image or album');
  next(err);
};

export function publicGalleryRoutes(repository) {
  const router=Router();
  router.get('/albums', asyncRoute(async(req,res)=> {
    const featured=req.query.featured;
    if(featured !== undefined && !['true','false','1','0'].includes(featured)) return error(res,400,'VALIDATION_ERROR','Invalid featured filter');
    const albums=await repository.listPublic({featured:featured==='true'||featured==='1'});
    return res.json({albums});
  }));
  router.get('/albums/:slug',asyncRoute(async(req,res)=> {
    const r=slugSchema.safeParse(req.params.slug);
    if(!r.success)return error(res,404,'NOT_FOUND','Album not found');
    const result=await repository.publicAlbum(r.data);
    if(!result)return error(res,404,'NOT_FOUND','Album not found');
    return res.json(result);
  }));
  return router;
}

export function adminGalleryRoutes(repository, mediaService=galleryMediaService) {
  const router=Router();
  router.get('/media/:filename', (req,res,next)=>{
    if(!/^[0-9a-f-]{36}\.webp$/i.test(req.params.filename))return error(res,404,'NOT_FOUND','Image not found');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.sendFile(join(galleryDiskDirectory,req.params.filename),e=>{if(e&&!res.headersSent){if(e.status===404||e.code==='ENOENT')res.status(404).end();else next(e);}});
  });
  router.get('/albums',asyncRoute(async(_req,res)=>res.json({albums:await repository.listAdmin()})));
  router.post('/albums',asyncRoute(async(req,res,next)=> {
    const data=checkData(res,albumSchema,req.body);if(!data)return;
    if(data.published && !data.coverMediaId)return error(res,400,'COVER_REQUIRED','Upload a cover before publishing');
    if(!(await existsMedia(repository,data)))return error(res,400,'INVALID_IMAGE','Cover image not found');
    try{const id=await repository.createAlbum(data);return res.status(201).json(await repository.adminAlbum(id));}catch(e){normalizeDbErrors(e,res,next);}
  }));
  router.get('/albums/:id',asyncRoute(async(req,res)=> {
    const id=checkId(res,req.params.id);if(!id)return;
    const result=await repository.adminAlbum(id);
    return result?res.json(result):error(res,404,'NOT_FOUND','Album not found');
  }));
  router.patch('/albums/:id',asyncRoute(async(req,res,next)=> {
    const id=checkId(res,req.params.id);if(!id)return;
    const original=await repository.adminAlbum(id);if(!original)return error(res,404,'NOT_FOUND','Album not found');
    const data=checkData(res,albumSchema.partial().strict(),req.body);if(!data)return;
    const merged={ ...original.album, ...data};
    if(merged.published && !merged.coverMediaId)return error(res,400,'COVER_REQUIRED','Upload a cover before publishing');
    if(!(await existsMedia(repository,merged)))return error(res,400,'INVALID_IMAGE','Cover image not found');
    try{await repository.updateAlbum(id,merged);return res.json(await repository.adminAlbum(id));}catch(e){normalizeDbErrors(e,res,next);}
  }));
  router.delete('/albums/:id',asyncRoute(async(req,res)=>{
    const id=checkId(res,req.params.id);if(!id)return;
    const deleted=await repository.deleteAlbum(id);
    return deleted?res.status(204).end():error(res,404,'NOT_FOUND','Album not found');
  }));
  // Protect against unbounded image-processing requests even from a compromised admin account.
  const uploadLimiter=rateLimit({windowMs:60_000,limit:15,standardHeaders:'draft-7',legacyHeaders:false});
  router.post('/media',uploadLimiter,(req,res,next)=>galleryUpload(req,res,e=> {
    if(e) return error(res,e.code==='LIMIT_FILE_SIZE'?413:400,'UPLOAD_REJECTED','Only JPG, PNG or WebP images up to 8 MB are accepted');
    next();
  }),asyncRoute(async(req,res)=>{
    const parsed=z.object({altText:trim(500).default('')}).strict().safeParse(req.body ?? {});
    if(!parsed.success)return error(res,400,'VALIDATION_ERROR','Invalid image description');
    try{const media=await mediaService.create({file:req.file,adminId:req.admin.id,altText:parsed.data.altText,repository});return res.status(201).json({media});}
    catch(e){if(e.status===400)return error(res,400,'INVALID_IMAGE',e.message);throw e;}
  }));
  router.post('/albums/:id/photos',asyncRoute(async(req,res)=> {
    const id=checkId(res,req.params.id);if(!id)return;
    const data=checkData(res,photoSchema,req.body);if(!data)return;
    if(!await repository.adminAlbum(id))return error(res,404,'NOT_FOUND','Album not found');
    if(!await repository.isGalleryMedia(data.mediaId))return error(res,400,'INVALID_IMAGE','Uploaded image not found');
    const photoId=await repository.addPhoto(id,data);
    return res.status(201).json({photoId});
  }));
  router.patch('/albums/:id/photos/:photoId',asyncRoute(async(req,res)=> {
    const id=checkId(res,req.params.id), photoId=checkId(res,req.params.photoId);if(!id||!photoId)return;
    const data=checkData(res,photoUpdate,req.body);if(!data)return;
    const album=await repository.adminAlbum(id);
    const original=album?.photos.find(p=>p.id===photoId);if(!original)return error(res,404,'NOT_FOUND','Photo not found');
    const merged={...original,...data};
    if(!await repository.isGalleryMedia(merged.mediaId))return error(res,400,'INVALID_IMAGE','Uploaded image not found');
    await repository.updatePhoto(id,photoId,merged);
    return res.json(await repository.adminAlbum(id));
  }));
  router.delete('/albums/:id/photos/:photoId',asyncRoute(async(req,res)=>{
    const id=checkId(res,req.params.id), photoId=checkId(res,req.params.photoId);if(!id||!photoId)return;
    const deleted=await repository.deletePhoto(id,photoId);
    return deleted?res.status(204).end():error(res,404,'NOT_FOUND','Photo not found');
  }));
  router.put('/albums/:id/photos/order',asyncRoute(async(req,res)=>{
    const id=checkId(res,req.params.id);if(!id)return;
    const data=checkData(res,z.object({photoIds:z.array(idSchema).max(2000)}).strict(),req.body);if(!data)return;
    if(!await repository.adminAlbum(id))return error(res,404,'NOT_FOUND','Album not found');
    const updated=await repository.reorderPhotos(id,data.photoIds);
    return updated?res.json(await repository.adminAlbum(id)):error(res,409,'INVALID_ORDER','Photo order does not match this album');
  }));
  return router;
}
