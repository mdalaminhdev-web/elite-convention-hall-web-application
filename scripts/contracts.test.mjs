/**
 * Dependency-free source/SQL contract checks.
 * These checks run WITHOUT npm install, MySQL or browser and are NOT runtime E2E tests.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=dirname(dirname(fileURLToPath(import.meta.url)));
const read=path=>readFileSync(join(base,path),'utf8');

test('PRD homepage section order and both public/admin routes are preserved',()=>{
 const app=read('frontend/public-website/src/App.jsx');
 const sections=['<Hero/>','<About/>','<Gallery/>','<QueryCalendar/>','<Facilities/>','<Vendors/>','<Reviews/>','<FAQ/>','<Contact/>'];
 let last=-1;
 for(const section of sections){const at=app.indexOf(section);assert.ok(at>last,`Missing or reordered homepage section: ${section}`);last=at;}
 assert.match(app,/path="\/gallery"/);
 assert.match(app,/path="\/gallery\/:slug"/);
 assert.match(app,/path="\/inquiry"/);
});

test('calendar reads Bangladesh current month and preserves missing-versus-zero manual counts',()=>{
 const ui=read('frontend/public-website/src/sections/QueryCalendar.jsx');
 const backend=read('backend/src/modules/inquiries/inquiry-repository.js');
 assert.match(ui,/Asia\/Dhaka/);
 assert.match(ui,/counts\.mode==='MANUAL'&&!lookup\.has\(date\)/);
 assert.match(ui,/lookup\.get\(date\)\?\?0/);
 assert.match(backend,/if\(mode==='MANUAL'\)/);
 assert.match(backend,/FROM manual_inquiry_counts/);
 assert.match(backend,/FROM inquiries WHERE event_date/);
 assert.match(backend,/if\(mode==='HIDDEN'\)/);
 const sql=read('database/migrations/009_inquiry_count_management.sql');
 assert.match(sql,/`display_count` INT UNSIGNED NOT NULL/);
 assert.match(sql,/ENUM\('REAL','MANUAL','HIDDEN'\)/);
 assert.match(sql,/PRIMARY KEY \(`event_date`\)/);
});

test('customer inquiries are separate from manual count records and deduplicated',()=>{
 const sql=read('database/migrations/008_inquiries.sql');
 assert.match(sql,/`submission_key` CHAR\(36\)/);
 assert.match(sql,/UNIQUE KEY `uq_inquiry_submission_key`/);
 assert.match(sql,/`preferred_shift` ENUM\('DAY','NIGHT'\)/);
 const routes=read('backend/src/modules/inquiries/inquiry-routes.js');
 assert.match(routes,/Our team will review it and confirm actual venue availability/);
 assert.doesNotMatch(routes,/confirm(?:ed)?\s+booking|reserv(?:ed|ation)\s+success/i);
});

test('state-changing Admin CMS modules use Admin authorization and CSRF guards',()=>{
 const source=read('backend/src/app.js');
 for(const module of ['inquiries','calendar','content','site','gallery'])assert.ok(source.includes(`adminApi.use('/${module}'`),`Missing protected module ${module}`);
 assert.match(source,/adminApi\.use\('\/site', requireAdmin\(repository\)/);
 assert.match(source,/adminApi\.use\('\/gallery', requireAdmin\(repository\)/);
 assert.match(source,/adminApi\.use\('\/content',requireAdmin\(repository\)/);
 assert.match(source,/requireCsrf\(req,res,next\)/);
 assert.match(source,/guardAdminOrigin/);
 const security=read('backend/src/security/admin-security.js');
 assert.match(security,/httpOnly: true/);
 assert.match(security,/sameSite: 'lax'/);
 assert.match(security,/timingSafeEqual/);
});

test('public images require current publication authorization',()=>{
 const app=read('backend/src/app.js');
 assert.match(app,/gallery\.isPublicImageKey/);
 assert.match(app,/content\.isPublicContentImageKey/);
 assert.match(app,/site\.isPublicImageKey/);
 assert.match(app,/if\(!allowed\)return res\.status\(404\)/);
});

test('database migrations are versioned in the original dependency order',()=>{
 const names=readdirSync(join(base,'database/migrations')).filter(s=>s.endsWith('.sql')).sort();
 assert.deepEqual(names,['000_database.sql','001_admin_security.sql','002_media_and_site.sql','003_hero_about.sql','004_gallery.sql','005_facilities_vendors.sql','006_reviews_faq.sql','007_contact_footer.sql','008_inquiries.sql','009_inquiry_count_management.sql','010_admin_audit.sql']);
 assert.match(read('database/migrations/000_database.sql'),/elite_convention_hall/);
});
