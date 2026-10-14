import {siteRepository} from './modules/site-cms/site-repository.js';
import {publicSiteRoutes, adminSiteRoutes} from './modules/site-cms/site-routes.js';
import express from 'express';
import {contentRepository} from './modules/public-content/content-repository.js';
import {publicContentRoutes,adminContentRoutes} from './modules/public-content/content-routes.js';
import helmet from 'helmet';
import { env } from './config/env.js';
import { adminRepository } from './modules/auth/admin-repository.js';
import { authRoutes } from './modules/auth/auth-routes.js';
import { adminSessionMiddleware, guardAdminOrigin, requireAdmin, setNoStore } from './security/admin-security.js';
import { productionSessionStore } from './security/mysql-session-store.js';
import { galleryRepository } from './modules/gallery/gallery-repository.js';
import { publicGalleryRoutes, adminGalleryRoutes } from './modules/gallery/gallery-routes.js';
import { galleryDiskDirectory } from './modules/gallery/gallery-media.js';
import { join } from 'node:path';
import { requireCsrf } from './security/admin-security.js';
import { inquiryRepository } from './modules/inquiries/inquiry-repository.js';
import { publicInquiryRoutes,adminInquiryRoutes,adminCalendarRoutes } from './modules/inquiries/inquiry-routes.js';

export function createApp({ sessionStore = productionSessionStore, repository = adminRepository, gallery = galleryRepository, inquiries = inquiryRepository, content = contentRepository, site = siteRepository, mediaService } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (env.TRUST_PROXY === 1) app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '100kb', strict: true }));

  // A published photo or album cover is public; draft uploads are NOT.
  // All media lookups check current publishing state; Nginx must proxy this path to Express.
  app.get('/media/gallery/:filename', async(req,res,next) => {
    try {
      if(!/^[0-9a-f-]{36}\.webp$/i.test(req.params.filename)) return res.status(404).end();
      const allowed=await gallery.isPublicImageKey('gallery/'+req.params.filename);
      if(!allowed)return res.status(404).end();
      res.setHeader('Cache-Control','no-store');
      res.setHeader('X-Content-Type-Options','nosniff');
      return res.sendFile(join(galleryDiskDirectory,req.params.filename),e=>{if(e&&!res.headersSent){if(e.status===404||e.code==='ENOENT')res.status(404).end();else next(e);}});
    }catch(e){next(e);}
  });
  // Public content media is served only while referenced by a published item.
  app.get('/media/content/:filename', async(req,res,next)=>{
    try {
      if(!/^[0-9a-f-]{36}\.webp$/i.test(req.params.filename))return res.status(404).end();
      const allowed=await content.isPublicContentImageKey('gallery/'+req.params.filename);
      if(!allowed)return res.status(404).end();
      res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
      return res.sendFile(join(galleryDiskDirectory,req.params.filename),e=>{if(e&&!res.headersSent){if(e.status===404||e.code==='ENOENT')res.status(404).end();else next(e);}});
    }catch(e){next(e);}
  });
  // Site media must be referenced by current published Hero, About, logo or Footer content.
  app.get('/media/site/:filename', async(req,res,next)=>{
    try{
      if(!/^[0-9a-f-]{36}\.webp$/i.test(req.params.filename))return res.status(404).end();
      if(!await site.isPublicImageKey('gallery/'+req.params.filename))return res.status(404).end();
      res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
      return res.sendFile(join(galleryDiskDirectory,req.params.filename),e=>{if(e&&!res.headersSent){if(e.status===404||e.code==='ENOENT')res.status(404).end();else next(e);}});
    }catch(e){next(e);}
  });
  app.use('/api/v1/site',publicSiteRoutes(site));
  app.use('/api/v1/content',publicContentRoutes(content));
  app.use('/api/v1/gallery', publicGalleryRoutes(gallery));
  app.use('/api/v1/inquiries', publicInquiryRoutes(inquiries));

  app.get('/api/v1/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ status: 'ok', service: 'elite-convention-website-api' });
  });

  // Only the protected CMS's API namespace receives a session cookie.
  const adminApi = express.Router();
  adminApi.use(setNoStore);
  adminApi.use(adminSessionMiddleware(sessionStore));
  adminApi.use(guardAdminOrigin);
  adminApi.use('/auth', authRoutes(repository));
  adminApi.use('/inquiries', requireAdmin(repository),adminInquiryRoutes(inquiries));
  adminApi.use('/calendar', requireAdmin(repository),(req,res,next) => ['GET','HEAD','OPTIONS'].includes(req.method) ? next() : requireCsrf(req,res,next),adminCalendarRoutes(inquiries));
  adminApi.use('/content',requireAdmin(repository),(req,res,next)=>['GET','HEAD','OPTIONS'].includes(req.method)?next():requireCsrf(req,res,next),adminContentRoutes(content));
  adminApi.use('/site', requireAdmin(repository), (req,res,next)=>['GET','HEAD','OPTIONS'].includes(req.method)?next():requireCsrf(req,res,next), adminSiteRoutes(site));
  adminApi.use('/gallery', requireAdmin(repository), (req,res,next) => { if (['GET','HEAD','OPTIONS'].includes(req.method)) return next(); return requireCsrf(req,res,next); }, adminGalleryRoutes(gallery, mediaService));
  // Protected endpoint for testing access-control foundation; no business records exposed.
  adminApi.get('/ping', requireAdmin(repository), (req, res) =>
    res.json({ status: 'authenticated', admin: req.admin }));
  app.use('/api/v1/admin', adminApi);

  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found' } }));
  app.use((error, _req, res, _next) => {
    console.error('Unhandled API error', { name: error?.name, code: error?.code });
    if (res.headersSent) return;
    if (error?.type === 'entity.parse.failed' || (error instanceof SyntaxError && error?.status === 400)) {
      return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Invalid JSON request body' } });
    }
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } });
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
  });
  return app;
}

export const app = createApp();
