/**
 * Phase 12 cross-module API integration tests.
 * One Express app, one session agent and shared repositories across public/admin routes.
 * Repository adapters are in memory; LIVE MySQL verification remains separate.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';

const password = 'phase12-demo-strong-password';
const passwordHash = await bcrypt.hash(password, 4); // Fixture only, NOT a production setting.
const admin = {id:'1',full_name:'Phase 12 Tester',email:'phase12@example.test',password_hash:passwordHash,is_active:1};
const clone = obj => structuredClone(obj);

function fixture(){
 const s = {
  mode:'HIDDEN', manual:new Map(), inquiries:[], albums:[], photos:[],
  hero:{tagline:'Celebrate Your Special Moments With Us',mainHeading:'A Perfect Venue for Your Unforgettable Events',supportingDescription:'',ctaText:'Check Venue Availability',ctaDestination:'#query-calendar',ctaSupportingNote:'Our team confirms availability.',backgroundMediaId:null,backgroundUrl:null},
  about:{sectionHeading:'About Elite Convention Hall',introduction:'',brandStory:'',serviceApproach:'',experienceStrengths:'',brandValues:'',highlights:[],images:[]},
  footer:{brandDescription:'',copyrightText:'',logoMediaId:null,logoUrl:null,brand:{brandName:'Elite Convention Hall',logoMediaId:null,logoUrl:null},links:[]},
  facilities:[], vendors:[], reviews:[], faqs:[],vendorCategories:[],faqCategories:[],social:[],
  contact:{phone:null,whatsapp:null,email:null,venueAddress:null,mapUrl:null,contactHours:null},
 };
 let albumId=0, photoId=0, contentId=0, childId=0;
 const auth={
  async findByEmail(email){return email===admin.email?admin:null;},
  async findById(id){return String(id)===admin.id?admin:null;},
  async recordSuccessfulLogin(){},
 };
 const albumDetails = id=>{
  const album=s.albums.find(a=>a.id===String(id));
  return album?{album:clone(album),photos:clone(s.photos.filter(p=>p.albumId===String(id)))}:null;
 };
 const gallery={
  async listPublic({featured=false}={}){return clone(s.albums.filter(a=>a.published&&(!featured||a.featured)));},
  async publicAlbum(slug){const a=s.albums.find(a=>a.slug===slug&&a.published);if(!a)return null;return {album:clone(a),photos:clone(s.photos.filter(p=>p.albumId===a.id&&p.published))};},
  async listAdmin(){return clone(s.albums);},async adminAlbum(id){return albumDetails(id);},
  async createAlbum(data){const id=String(++albumId);s.albums.push({id,...data,photoCount:0});return id;},
  async updateAlbum(id,data){const row=s.albums.find(a=>a.id===String(id));if(!row)return false;Object.assign(row,data);return true;},
  async deleteAlbum(id){const index=s.albums.findIndex(a=>a.id===String(id));if(index<0)return false;s.albums.splice(index,1);s.photos=s.photos.filter(p=>p.albumId!==String(id));return true;},
  async addPhoto(albumId,data){const id=String(++photoId);s.photos.push({id,albumId:String(albumId),...data,sortOrder:s.photos.length,url:'/media/gallery/11111111-1111-4111-8111-111111111111.webp'});return id;},
  async updatePhoto(albumId,id,data){const row=s.photos.find(p=>p.albumId===String(albumId)&&p.id===String(id));if(!row)return false;Object.assign(row,data);return true;},
  async deletePhoto(albumId,id){const index=s.photos.findIndex(p=>p.albumId===String(albumId)&&p.id===String(id));if(index<0)return false;s.photos.splice(index,1);return true;},
  async reorderPhotos(albumId,ids){const items=s.photos.filter(p=>p.albumId===String(albumId));if(items.length!==ids.length||new Set(ids).size!==ids.length||ids.some(id=>!items.some(p=>p.id===id)))return false;ids.forEach((id,i)=>{items.find(p=>p.id===id).sortOrder=i;});return true;},
  async isGalleryMedia(id){return ['9','10'].includes(String(id));},
  async isPublicImageKey(){return false;},
 };
 const inquiry={
  async publicMonth(month){let counts=[];if(s.mode==='MANUAL')counts=[...s.manual].filter(([day])=>day.startsWith(month)).map(([date,count])=>({date,count}));if(s.mode==='REAL'){const tally=new Map();for(const i of s.inquiries){if(i.eventDate.startsWith(month))tally.set(i.eventDate,(tally.get(i.eventDate)||0)+1);}counts=[...tally].map(([date,count])=>({date,count}));}return {month,mode:s.mode,counts};},
  async insertInquiry(record){const existing=s.inquiries.find(i=>i.submissionKey===record.submissionKey);if(existing)return {id:existing.id,duplicate:true};const id=String(s.inquiries.length+1);s.inquiries.push({id,...record,submittedAt:new Date().toISOString()});return {id,duplicate:false};},
  async adminList({page=1,pageSize=20,search='',eventDate='',shift=''}){const rows=s.inquiries.filter(i=>(`${i.fullName} ${i.phoneNumber} ${i.email}`).toLowerCase().includes(search.toLowerCase())&&(!eventDate||i.eventDate===eventDate)&&(!shift||i.preferredShift===shift));return {items:clone(rows.slice((page-1)*pageSize,page*pageSize)),page,pageSize,total:rows.length,totalPages:Math.ceil(rows.length/pageSize)};},
  async adminGet(id){const i=s.inquiries.find(i=>i.id===String(id));return i?clone(i):null;},
  async adminSummary(){return {total:s.inquiries.length,submittedToday:s.inquiries.length,datesWithInquiries:new Set(s.inquiries.map(x=>x.eventDate)).size};},
  async adminDashboard(){return {metrics:{totalInquiries:s.inquiries.length,submittedToday:s.inquiries.length,submittedThisMonth:s.inquiries.length,datesWithInquiries:new Set(s.inquiries.map(x=>x.eventDate)).size,publishedAlbums:s.albums.filter(a=>a.published).length},calendarMode:s.mode,recentInquiries:clone(s.inquiries.slice(-6)),dailyActivity:[],businessTimeZone:'Asia/Dhaka'};},
  async adminSettings(){return {mode:s.mode};},async adminSetMode(mode){s.mode=mode;return {mode};},
  async adminManualCounts(month){return [...s.manual].filter(([d])=>d.startsWith(month)).map(([date,count])=>({date,count}));},
  async adminUpsertCount(date,count){s.manual.set(date,count);return {date,count};},
  async adminDeleteCount(date){return s.manual.delete(date);},
 };
 const content={
  async list(entity,privileged){return clone((s[entity]||[]).filter(row=>privileged||row.published||row.visible));},
  async getContact(){return clone(s.contact);},
  async updateContact(data){Object.assign(s.contact,data);return clone(s.contact);},
  async create(entity,data){const id=String(++contentId);s[entity].push({id,...data});return id;},
  async saveFacility(data,id){if(id){const item=s.facilities.find(r=>r.id===id);if(!item)return false;Object.assign(item,data);return true;}const newId=String(++contentId);s.facilities.push({id:newId,...data});return newId;},
  async update(entity,id,data){const row=s[entity].find(r=>r.id===id);if(!row)return false;Object.assign(row,data);return true;},
  async remove(entity,id){const arr=s[entity];const index=arr.findIndex(r=>r.id===id);if(index<0)return false;arr.splice(index,1);return true;},
  async isContentMedia(){return true;},async isPublicContentImageKey(){return false;},
 };
 const children={highlights:[],images:[],links:[]};
 const site={
  async getHero(){return clone(s.hero);},
  async getAbout(privileged){return {...clone(s.about),highlights:clone(children.highlights.filter(x=>privileged||x.visible)),images:clone(children.images.filter(x=>privileged||x.visible))};},
  async getFooter(privileged){return {...clone(s.footer),links:clone(children.links.filter(x=>privileged||x.visible))};},
  async validMediaId(id){return ['9','10'].includes(id);},
  async isPublicImageKey(){return false;},
  async saveSingleton(entity,data){if(entity==='brand')Object.assign(s.footer.brand,data);else Object.assign(s[entity],data);},
  async listChildren(entity,privileged){return clone(children[entity].filter(x=>privileged||x.visible));},
  async createChild(entity,data){const id=String(++childId);children[entity].push({id,...data});return id;},
  async updateChild(entity,id,data){const row=children[entity].find(x=>x.id===id);if(!row)return false;Object.assign(row,data);return true;},
  async deleteChild(entity,id){const index=children[entity].findIndex(x=>x.id===id);if(index<0)return false;children[entity].splice(index,1);return true;},
 };
 return {app:createApp({sessionStore:new session.MemoryStore(),repository:auth,gallery,inquiries:inquiry,content,site}),state:s};
}

async function authenticate(agent){
 const csrf=(await agent.get('/api/v1/admin/auth/csrf').expect(200)).body.csrfToken;
 const signedIn=await agent.post('/api/v1/admin/auth/login').set('x-csrf-token',csrf).send({email:admin.email,password}).expect(200);
 return signedIn.body.csrfToken;
}
const form = {submissionKey:'11111111-1111-4111-8111-111111111111',fullName:'Inquiry Integration Tester',phoneNumber:'+8801712345678',email:'customer@example.test',eventDate:'2026-11-18',preferredShift:'DAY',eventType:'Wedding',guestCount:200,companyOrganization:'',additionalDetails:'Initial venue inquiry only.'};

test('cross-module: Admin changes calendar mode, manual zero stays explicit, and real submissions appear only in REAL mode',async()=>{
 const {app,state}=fixture();
 assert.deepEqual((await request(app).get('/api/v1/inquiries/calendar?month=2026-11').expect(200)).body,{month:'2026-11',mode:'HIDDEN',counts:[]});
 const agent=request.agent(app),csrf=await authenticate(agent);
 await agent.patch('/api/v1/admin/calendar/settings').send({mode:'MANUAL'}).expect(403);
 await agent.patch('/api/v1/admin/calendar/settings').set('x-csrf-token',csrf).send({mode:'MANUAL'}).expect(200);
 await agent.put('/api/v1/admin/calendar/manual-counts/2026-11-18').set('x-csrf-token',csrf).send({count:0}).expect(200);
 const manual=(await request(app).get('/api/v1/inquiries/calendar?month=2026-11').expect(200)).body;
 assert.deepEqual(manual.counts,[{date:'2026-11-18',count:0}]);
 assert.equal(manual.counts.find(x=>x.date==='2026-11-19'),undefined,'No entry must remain blank, not 0');
 const submission=await request(app).post('/api/v1/inquiries').send(form).expect(201);
 assert.equal(submission.body.received,true);
 assert.match(submission.body.message,/confirm actual venue availability/);
 assert.deepEqual((await request(app).get('/api/v1/inquiries/calendar?month=2026-11').expect(200)).body.counts,manual.counts,'Submitted inquiry cannot overwrite manual count');
 const repeat=await request(app).post('/api/v1/inquiries').send(form).expect(200);
 assert.equal(repeat.body.duplicate,true);assert.equal(state.inquiries.length,1);
 await agent.patch('/api/v1/admin/calendar/settings').set('x-csrf-token',csrf).send({mode:'REAL'}).expect(200);
 assert.deepEqual((await request(app).get('/api/v1/inquiries/calendar?month=2026-11').expect(200)).body.counts,[{date:'2026-11-18',count:1}]);
 const list=await agent.get('/api/v1/admin/inquiries?eventDate=2026-11-18&shift=DAY').expect(200);
 assert.equal(list.body.total,1);assert.equal(list.body.items[0].fullName,form.fullName);
 await request(app).get('/api/v1/admin/inquiries').expect(401);
 await agent.patch('/api/v1/admin/calendar/settings').set('x-csrf-token',csrf).send({mode:'HIDDEN'}).expect(200);
 assert.deepEqual((await request(app).get('/api/v1/inquiries/calendar?month=2026-11').expect(200)).body.counts,[]);
 assert.equal(state.inquiries.length,1,'HIDDEN mode must not delete real inquiries');
 await agent.patch('/api/v1/admin/calendar/settings').set('x-csrf-token',csrf).send({mode:'MANUAL'}).expect(200);
 await agent.delete('/api/v1/admin/calendar/manual-counts/2026-11-18').set('x-csrf-token',csrf).expect(204);
 assert.deepEqual((await request(app).get('/api/v1/inquiries/calendar?month=2026-11').expect(200)).body.counts,[],'Deleting explicit zero restores blank');
});

test('cross-module: Gallery CMS publishing controls determine public album and photo access',async()=>{
 const {app}=fixture();
 await request(app).get('/api/v1/admin/gallery/albums').expect(401);
 const agent=request.agent(app),csrf=await authenticate(agent);
 const draft=await agent.post('/api/v1/admin/gallery/albums').set('x-csrf-token',csrf).send({slug:'test-event',title:'Test Event',description:'Internal test fixture',featured:true,published:false,sortOrder:0,coverMediaId:'9'}).expect(201);
 const id=draft.body.album.id;
 assert.equal((await request(app).get('/api/v1/gallery/albums').expect(200)).body.albums.length,0);
 await request(app).get('/api/v1/gallery/albums/test-event').expect(404);
 await agent.patch(`/api/v1/admin/gallery/albums/${id}`).set('x-csrf-token',csrf).send({published:true}).expect(200);
 const photo=await agent.post(`/api/v1/admin/gallery/albums/${id}/photos`).set('x-csrf-token',csrf).send({mediaId:'9',caption:'Hall',altText:'Venue hall',published:false}).expect(201);
 assert.equal((await request(app).get('/api/v1/gallery/albums?featured=true').expect(200)).body.albums.length,1);
 assert.equal((await request(app).get('/api/v1/gallery/albums/test-event').expect(200)).body.photos.length,0);
 await agent.patch(`/api/v1/admin/gallery/albums/${id}/photos/${photo.body.photoId}`).set('x-csrf-token',csrf).send({published:true}).expect(200);
 assert.equal((await request(app).get('/api/v1/gallery/albums/test-event').expect(200)).body.photos.length,1);
 await agent.patch(`/api/v1/admin/gallery/albums/${id}`).set('x-csrf-token',csrf).send({published:false}).expect(200);
 await request(app).get('/api/v1/gallery/albums/test-event').expect(404);
});

test('cross-module: Public Hero and Footer immediately reflect authorized CMS changes, unsafe destinations are rejected',async()=>{
 const {app}=fixture();const agent=request.agent(app),csrf=await authenticate(agent);
 await agent.patch('/api/v1/admin/site/hero').set('x-csrf-token',csrf).send({mainHeading:'Plan Your Celebration',ctaDestination:'#query-calendar'}).expect(200);
 assert.equal((await request(app).get('/api/v1/site/hero').expect(200)).body.hero.mainHeading,'Plan Your Celebration');
 await agent.patch('/api/v1/admin/site/hero').set('x-csrf-token',csrf).send({ctaDestination:'https://evil.example/booking'}).expect(400);
 const link=await agent.post('/api/v1/admin/site/links').set('x-csrf-token',csrf).send({group:'POLICY',label:'Privacy Policy',destination:'/privacy',sortOrder:0,visible:false}).expect(201);
 assert.equal((await request(app).get('/api/v1/site/footer').expect(200)).body.footer.links.length,0);
 await agent.patch(`/api/v1/admin/site/links/${link.body.id}`).set('x-csrf-token',csrf).send({visible:true}).expect(200);
 assert.equal((await request(app).get('/api/v1/site/footer').expect(200)).body.footer.links[0].destination,'/privacy');
 await agent.post('/api/v1/admin/site/links').set('x-csrf-token',csrf).send({group:'POLICY',label:'Unsafe',destination:'javascript:alert(1)',sortOrder:0,visible:true}).expect(400);
});

test('cross-module: CMS facility draft remains hidden, publishing makes it visible; contact edits appear in public API',async()=>{
 const {app}=fixture();const agent=request.agent(app),csrf=await authenticate(agent);
 const facility={name:'Approved Hall',description:'Test only',capacity:200,capacityNote:'Seated',imageMediaId:null,iconKey:'building',sortOrder:0,published:false,amenities:['Air conditioning'],serviceFeatures:['Event support']};
 const created=await agent.post('/api/v1/admin/content/facilities').set('x-csrf-token',csrf).send(facility).expect(201);
 assert.equal((await request(app).get('/api/v1/content/facilities').expect(200)).body.items.length,0);
 await agent.patch(`/api/v1/admin/content/facilities/${created.body.id}`).set('x-csrf-token',csrf).send({published:true}).expect(200);
 const published=(await request(app).get('/api/v1/content/facilities').expect(200)).body.items;
 assert.equal(published.length,1);assert.deepEqual(published[0].amenities,['Air conditioning']);
 await agent.patch('/api/v1/admin/content/contact').set('x-csrf-token',csrf).send({phone:'+8801712345678',email:'hello@example.test'}).expect(200);
 const contact=(await request(app).get('/api/v1/content/contact').expect(200)).body.contact;
 assert.equal(contact.phone,'+8801712345678');
 await agent.patch('/api/v1/admin/content/contact').send({phone:'unknown'}).expect(403);
 await agent.patch('/api/v1/admin/content/contact').set('origin','https://malicious.example').set('x-csrf-token',csrf).send({phone:'unknown'}).expect(403);
});

test('cross-module: Admin dashboard totals update from same inquiry/gallery records and session logout denies access',async()=>{
 const {app}=fixture();const agent=request.agent(app),csrf=await authenticate(agent);
 await request(app).post('/api/v1/inquiries').send(form).expect(201);
 const response=await agent.get('/api/v1/admin/inquiries/dashboard').expect(200);
 assert.equal(response.body.metrics.totalInquiries,1);
 assert.equal(Object.hasOwn(response.body.metrics,'confirmedBookings'),false);
 assert.equal(response.body.businessTimeZone,'Asia/Dhaka');
 await agent.post('/api/v1/admin/auth/logout').set('x-csrf-token',csrf).expect(204);
 await agent.get('/api/v1/admin/inquiries/dashboard').expect(401);
 await agent.get('/api/v1/admin/content/contact').expect(401);
});
