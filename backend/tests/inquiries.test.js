import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import {createApp} from '../src/app.js';

const password='correct-admin-password';
const passwordHash=await bcrypt.hash(password,4);
const user={id:'1',full_name:'Admin',email:'admin@example.test',is_active:1,password_hash:passwordHash};
function fixture(){
 let mode='MANUAL';const counts=new Map([['2026-10-13',0],['2026-10-14',7]]);let submissions=[];
 const auth={async findByEmail(email){return email===user.email?user:null;},async findById(id){return String(id)==='1'?user:null;},async recordSuccessfulLogin(){}};
 const inquiry={
  async publicMonth(month){return {month,mode,counts:mode==='HIDDEN'?[]:mode==='MANUAL'?[...counts].filter(([date])=>date.startsWith(month)).map(([date,count])=>({date,count})):submissions.filter(v=>v.eventDate.startsWith(month)).reduce((acc,s)=>{const r=acc.counts.find(x=>x.date===s.eventDate);if(r)r.count++;else acc.counts.push({date:s.eventDate,count:1});return acc;},{month,mode,counts:[]})};},
  async insertInquiry(body){const old=submissions.find(s=>s.submissionKey===body.submissionKey);if(old)return {id:old.id,duplicate:true};const data={...body,id:String(submissions.length+1),submittedAt:new Date().toISOString()};submissions.push(data);return {id:data.id,duplicate:false};},
  async adminList({page,pageSize,search,eventDate='',shift=''}){const matches=submissions.filter(s=>`${s.fullName} ${s.phoneNumber} ${s.email}`.toLowerCase().includes(search.toLowerCase())&&(!eventDate||s.eventDate===eventDate)&&(!shift||s.preferredShift===shift));return {items:matches.slice((page-1)*pageSize,page*pageSize),page,pageSize,total:matches.length,totalPages:Math.ceil(matches.length/pageSize)};},
  async adminGet(id){return submissions.find(s=>s.id===id)||null;},
  async adminSummary(){return {total:submissions.length,submittedToday:submissions.length,datesWithInquiries:new Set(submissions.map(s=>s.eventDate)).size};},
  async adminDashboard(){return {metrics:{totalInquiries:submissions.length,submittedToday:submissions.length,submittedThisMonth:submissions.length,datesWithInquiries:new Set(submissions.map(s=>s.eventDate)).size,publishedAlbums:0},calendarMode:mode,recentInquiries:submissions.slice(-6).reverse(),dailyActivity:[{date:'2026-10-13',count:0}],businessTimeZone:'Asia/Dhaka'};},
  async adminSettings(){return {mode};},async adminSetMode(m){mode=m;return {mode};},
  async adminManualCounts(month){return [...counts].filter(([d])=>d.startsWith(month)).map(([date,count])=>({date,count}));},
  async adminUpsertCount(date,count){counts.set(date,count);return {date,count};},
  async adminDeleteCount(date){return counts.delete(date);},
 };
 const gallery={async isPublicImageKey(){return false;}};
 return {app:createApp({sessionStore:new session.MemoryStore(),repository:auth,inquiries:inquiry,gallery}),getMode:()=>mode,getSubmissions:()=>submissions};
}
async function login(agent){
 const token=(await agent.get('/api/v1/admin/auth/csrf').expect(200)).body.csrfToken;
 const reply=await agent.post('/api/v1/admin/auth/login').set('x-csrf-token',token).send({email:user.email,password}).expect(200);
 return reply.body.csrfToken;
}
const draft=()=>({submissionKey:'11111111-1111-4111-8111-111111111111',fullName:'Example Customer',phoneNumber:'+8801712345678',email:'',eventDate:'2026-10-25',preferredShift:'DAY',eventType:'Wedding',guestCount:200,companyOrganization:'',additionalDetails:''});

test('manual mode returns explicit zero but omits days with no entries',async()=>{
 const {app}=fixture();const response=await request(app).get('/api/v1/inquiries/calendar?month=2026-10').expect(200);
 assert.equal(response.body.mode,'MANUAL');assert.deepEqual(response.body.counts,[{date:'2026-10-13',count:0},{date:'2026-10-14',count:7}]);
 assert.equal(response.body.counts.some(c=>c.date==='2026-10-15'),false);
});
test('public submission validates dates, shift and phone, then handles idempotent retry',async()=>{
 const {app,getSubmissions}=fixture();
 await request(app).post('/api/v1/inquiries').send({...draft(),eventDate:'2026-02-30'}).expect(400);
 await request(app).post('/api/v1/inquiries').send({...draft(),preferredShift:'MORNING'}).expect(400);
 await request(app).post('/api/v1/inquiries').send({...draft(),phoneNumber:'no-phone'}).expect(400);
 const first=await request(app).post('/api/v1/inquiries').send(draft()).expect(201);
 assert.equal(first.body.received,true);assert.equal(first.body.reference,'1');
 const repeat=await request(app).post('/api/v1/inquiries').send(draft()).expect(200);
 assert.equal(repeat.body.duplicate,true);assert.equal(getSubmissions().length,1);
});
test('admin count settings require authentication and CSRF',async()=>{
 const {app}=fixture();
 await request(app).get('/api/v1/admin/calendar/settings').expect(401);
 const agent=request.agent(app);const csrf=await login(agent);
 await agent.patch('/api/v1/admin/calendar/settings').send({mode:'REAL'}).expect(403);
 await agent.patch('/api/v1/admin/calendar/settings').set('x-csrf-token',csrf).send({mode:'BOOKED'}).expect(400);
 await agent.patch('/api/v1/admin/calendar/settings').set('x-csrf-token',csrf).send({mode:'REAL'}).expect(200);
 const real=await agent.get('/api/v1/inquiries/calendar?month=2026-10').expect(200);assert.equal(real.body.mode,'REAL');
 await agent.patch('/api/v1/admin/calendar/settings').set('x-csrf-token',csrf).send({mode:'HIDDEN'}).expect(200);
 const hidden=await agent.get('/api/v1/inquiries/calendar?month=2026-10').expect(200);assert.equal(hidden.body.counts.length,0);
});
test('admin can explicitly save zero and remove it so MANUAL mode becomes blank',async()=>{
 const {app}=fixture();const agent=request.agent(app);const csrf=await login(agent);
 const headers={'x-csrf-token':csrf};
 await agent.put('/api/v1/admin/calendar/manual-counts/2026-10-18').set(headers).send({count:0}).expect(200);
 const saved=await request(app).get('/api/v1/inquiries/calendar?month=2026-10').expect(200);
 assert.equal(saved.body.counts.find(v=>v.date==='2026-10-18').count,0);
 await agent.delete('/api/v1/admin/calendar/manual-counts/2026-10-18').set(headers).expect(204);
 const removed=await request(app).get('/api/v1/inquiries/calendar?month=2026-10').expect(200);
 assert.equal(removed.body.counts.some(v=>v.date==='2026-10-18'),false);
});
test('admin inquiry inbox is protected and returns complete event details',async()=>{
 const {app}=fixture();await request(app).post('/api/v1/inquiries').send(draft()).expect(201);
 await request(app).get('/api/v1/admin/inquiries').expect(401);
 const agent=request.agent(app);await login(agent);
 const list=await agent.get('/api/v1/admin/inquiries?page=1&pageSize=20').expect(200);
 assert.equal(list.body.total,1);
 const item=await agent.get('/api/v1/admin/inquiries/1').expect(200);
 assert.equal(item.body.inquiry.eventDate,'2026-10-25');assert.equal(item.body.inquiry.preferredShift,'DAY');
});

test('Dashboard requires admin session, provides live inquiry data, and never invents bookings',async()=>{
 const {app}=fixture();
 await request(app).get('/api/v1/admin/inquiries/dashboard').expect(401);
 await request(app).post('/api/v1/inquiries').send(draft()).expect(201);
 const agent=request.agent(app);await login(agent);
 const dashboard=await agent.get('/api/v1/admin/inquiries/dashboard').expect(200);
 assert.equal(dashboard.body.metrics.totalInquiries,1);
 assert.equal(dashboard.body.recentInquiries[0].fullName,'Example Customer');
 assert.equal(dashboard.body.calendarMode,'MANUAL');
 assert.equal(Object.hasOwn(dashboard.body.metrics,'confirmedBookings'),false);
 assert.equal(dashboard.body.businessTimeZone,'Asia/Dhaka');
});
test('Inquiry list validates filters and supports shift/date filtering',async()=>{
 const {app}=fixture();await request(app).post('/api/v1/inquiries').send(draft()).expect(201);
 const agent=request.agent(app);await login(agent);
 const found=await agent.get('/api/v1/admin/inquiries?eventDate=2026-10-25&shift=DAY').expect(200);
 assert.equal(found.body.total,1);
 const empty=await agent.get('/api/v1/admin/inquiries?eventDate=2026-10-25&shift=NIGHT').expect(200);
 assert.equal(empty.body.total,0);
 await agent.get('/api/v1/admin/inquiries?shift=RESERVED').expect(400);
 await agent.get('/api/v1/admin/inquiries?eventDate=2026-02-30').expect(400);
});
