import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import {createApp} from '../src/app.js';

const password='example-secret-phrase';
const hash=await bcrypt.hash(password,4);
const admin={id:'1',full_name:'CMS Tester',email:'cms@test.invalid',is_active:1,password_hash:hash};
function fixture(){
 const records={facilities:[],vendors:[],reviews:[],faqs:[],vendorCategories:[],faqCategories:[],social:[]};
 let contact={phone:null,whatsapp:null,email:null,venueAddress:null,mapUrl:null,contactHours:null};let id=1;
 const content={
  async list(name,privileged){return records[name].filter(row=>privileged||row.published||row.visible).filter(row=>privileged||(!['vendors','faqs'].includes(name)||row.categoryId==null||records[name==='vendors'?'vendorCategories':'faqCategories'].some(c=>c.id===row.categoryId&&c.visible)));},
  async create(name,data){const row={id:String(id++),...data};records[name].push(row);return row.id;},
  async update(name,pk,data){const row=records[name].find(x=>x.id===pk);if(!row)return false;Object.assign(row,data);return true;},
  async remove(name,pk){const idx=records[name].findIndex(x=>x.id===pk);if(idx<0)return false;records[name].splice(idx,1);return true;},
  async getContact(){return contact;},async updateContact(data){contact={...contact,...data};return contact;},
  async isContentMedia(){return true;},async isPublicContentImageKey(){return false;},
 };
 const auth={async findByEmail(email){return email===admin.email?admin:null;},async findById(key){return key===admin.id?admin:null;},async recordSuccessfulLogin(){}};
 const gallery={async isPublicImageKey(){return false;}};
 const app=createApp({sessionStore:new session.MemoryStore(),repository:auth,content,gallery});
 return {app,records};
}
async function signIn(agent){const first=await agent.get('/api/v1/admin/auth/csrf').expect(200);const reply=await agent.post('/api/v1/admin/auth/login').set('x-csrf-token',first.body.csrfToken).send({email:admin.email,password}).expect(200);return reply.body.csrfToken;}

test('public content endpoints expose empty collections without fabricated business records',async()=>{
 const {app}=fixture();
 for(const kind of ['facilities','vendors','reviews','faqs','vendorCategories','faqCategories','social']){
  const res=await request(app).get('/api/v1/content/'+kind).expect(200);assert.deepEqual(res.body.items,[]);
 }
 const contact=await request(app).get('/api/v1/content/contact').expect(200);assert.equal(contact.body.contact.phone,null);
});
test('admin changes require authenticated session and CSRF, draft rows stay private',async()=>{
 const {app}=fixture();const data={name:'Main Hall',description:'Confirmed facility',capacity:null,capacityNote:'',imageMediaId:null,iconKey:'',sortOrder:0,published:false};
 await request(app).post('/api/v1/admin/content/facilities').send(data).expect(401);
 const agent=request.agent(app);const csrf=await signIn(agent);
 await agent.post('/api/v1/admin/content/facilities').send(data).expect(403);
 const created=await agent.post('/api/v1/admin/content/facilities').set('x-csrf-token',csrf).send(data).expect(201);
 const id=created.body.id;
 assert.deepEqual((await request(app).get('/api/v1/content/facilities').expect(200)).body.items,[]);
 await agent.patch('/api/v1/admin/content/facilities/'+id).set('x-csrf-token',csrf).send({published:true}).expect(200);
 assert.equal((await request(app).get('/api/v1/content/facilities').expect(200)).body.items.length,1);
 await agent.delete('/api/v1/admin/content/facilities/'+id).set('x-csrf-token',csrf).expect(204);
 assert.deepEqual((await request(app).get('/api/v1/content/facilities').expect(200)).body.items,[]);
});
test('invalid inputs are rejected and saved contact details appear publicly',async()=>{
 const {app}=fixture();const agent=request.agent(app);const csrf=await signIn(agent);
 await agent.post('/api/v1/admin/content/reviews').set('x-csrf-token',csrf).send({clientName:'Person',testimonial:'Approved testimonial',rating:8}).expect(400);
 await agent.patch('/api/v1/admin/content/contact').set('x-csrf-token',csrf).send({mapUrl:'javascript:alert(1)'}).expect(400);
 await agent.patch('/api/v1/admin/content/contact').set('x-csrf-token',csrf).send({phone:'+8801700000000',email:'office@example.test'}).expect(200);
 const publicResponse=await request(app).get('/api/v1/content/contact').expect(200);assert.equal(publicResponse.body.contact.phone,'+8801700000000');
});
