import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import {createApp} from '../src/app.js';

const secret='integration-testing-password';
const passwordHash=await bcrypt.hash(secret,4);
const actor={id:'1',full_name:'Admin Tester',email:'admin@test.invalid',is_active:1,password_hash:passwordHash};
const defaults={
 hero:{tagline:'Celebrate Your Special Moments With Us',mainHeading:'A Perfect Venue for Your Unforgettable Events',supportingDescription:'',ctaText:'Check Venue Availability',ctaDestination:'#query-calendar',ctaSupportingNote:'Please submit an inquiry. Availability is confirmed by our team.',backgroundMediaId:null,backgroundUrl:null},
 about:{sectionHeading:'About Elite Convention Hall',introduction:'',brandStory:'',serviceApproach:'',experienceStrengths:'',brandValues:'',highlights:[],images:[]},
 footer:{brandDescription:'',copyrightText:'',logoMediaId:null,logoUrl:null,brand:{brandName:'Elite Convention Hall',logoMediaId:null,logoUrl:null},links:[]},
};
function setup(){
 const state=structuredClone(defaults), children={highlights:[],images:[],links:[]};let id=1;
 const repository={
  async getHero(){return structuredClone(state.hero);},
  async getAbout(admin=false){return {...structuredClone(state.about),highlights:children.highlights.filter(x=>admin||x.visible),images:children.images.filter(x=>admin||x.visible)};},
  async getFooter(admin=false){return {...structuredClone(state.footer),links:children.links.filter(x=>admin||x.visible)};},
  async validMediaId(mid){return mid==='7';},
  async isPublicImageKey(key){return key==='gallery/00000000-0000-0000-0000-000000000007.webp' && state.hero.backgroundMediaId==='7';},
  async saveSingleton(entity,data){if(entity==='brand')Object.assign(state.footer.brand,data);else Object.assign(state[entity],data);},
  async listChildren(entity,admin){return children[entity].filter(x=>admin||x.visible);},
  async createChild(entity,data){const row={id:String(id++),...data};children[entity].push(row);return row.id;},
  async updateChild(entity,uid,data){const row=children[entity].find(x=>x.id===uid);if(!row)return false;Object.assign(row,data);return true;},
  async deleteChild(entity,uid){const index=children[entity].findIndex(x=>x.id===uid);if(index<0)return false;children[entity].splice(index,1);return true;},
 };
 const auth={async findById(uid){return uid===actor.id?actor:null;},async findByEmail(email){return email===actor.email?actor:null;},async recordSuccessfulLogin(){}};
 const gallery={async isPublicImageKey(){return false;}};
 const content={async isPublicContentImageKey(){return false;}};
 const app=createApp({sessionStore:new session.MemoryStore(),repository:auth,site:repository,gallery,content});
 return {app,state,children};
}
async function login(agent){const csrf=(await agent.get('/api/v1/admin/auth/csrf').expect(200)).body.csrfToken;return (await agent.post('/api/v1/admin/auth/login').set('x-csrf-token',csrf).send({email:actor.email,password:secret}).expect(200)).body.csrfToken;}

test('public site API provides Hero, About and Footer without admin authentication',async()=>{
 const {app}=setup();
 assert.equal((await request(app).get('/api/v1/site/hero').expect(200)).body.hero.ctaDestination,'#query-calendar');
 assert.equal((await request(app).get('/api/v1/site/about').expect(200)).body.about.highlights.length,0);
 assert.equal((await request(app).get('/api/v1/site/footer').expect(200)).body.footer.brand.brandName,'Elite Convention Hall');
});

test('admin CMS requires authentication and CSRF; saved Hero content appears in public response',async()=>{
 const {app}=setup();
 await request(app).patch('/api/v1/admin/site/hero').send({tagline:'New tagline'}).expect(401);
 const agent=request.agent(app);const csrf=await login(agent);
 await agent.patch('/api/v1/admin/site/hero').send({tagline:'New tagline'}).expect(403);
 await agent.patch('/api/v1/admin/site/hero').set('x-csrf-token',csrf).send({tagline:'New approved tagline'}).expect(200);
 assert.equal((await request(app).get('/api/v1/site/hero').expect(200)).body.hero.tagline,'New approved tagline');
 await agent.patch('/api/v1/admin/site/hero').set('x-csrf-token',csrf).send({ctaDestination:'javascript:alert(1)'}).expect(400);
 await agent.patch('/api/v1/admin/site/hero').set('x-csrf-token',csrf).send({backgroundMediaId:'55'}).expect(400);
 await agent.patch('/api/v1/admin/site/hero').set('x-csrf-token',csrf).send({backgroundMediaId:'7'}).expect(200);
});

test('About highlights/images visibility and Footer policy links are publication controlled',async()=>{
 const {app}=setup();const agent=request.agent(app);const csrf=await login(agent);
 const highlight={title:'Approved highlight',description:'Short summary',iconKey:'diamond',sortOrder:0,visible:false};
 const created=await agent.post('/api/v1/admin/site/highlights').set('x-csrf-token',csrf).send(highlight).expect(201);
 assert.equal((await request(app).get('/api/v1/site/about').expect(200)).body.about.highlights.length,0);
 await agent.patch(`/api/v1/admin/site/highlights/${created.body.id}`).set('x-csrf-token',csrf).send({visible:true}).expect(200);
 assert.equal((await request(app).get('/api/v1/site/about').expect(200)).body.about.highlights.length,1);
 await agent.post('/api/v1/admin/site/images').set('x-csrf-token',csrf).send({mediaId:'55',caption:'Invalid',sortOrder:0,visible:false}).expect(400);
 const image=(await agent.post('/api/v1/admin/site/images').set('x-csrf-token',csrf).send({mediaId:'7',caption:'Approved photo',sortOrder:0,visible:false}).expect(201)).body;
 assert.equal((await request(app).get('/api/v1/site/about').expect(200)).body.about.images.length,0);
 await agent.patch('/api/v1/admin/site/images/'+image.id).set('x-csrf-token',csrf).send({visible:true}).expect(200);
 assert.equal((await request(app).get('/api/v1/site/about').expect(200)).body.about.images.length,1);
 await agent.post('/api/v1/admin/site/links').set('x-csrf-token',csrf).send({group:'POLICY',label:'Unsafe',destination:'//evil.example',sortOrder:0,visible:true}).expect(400);
 const createdPolicy=await agent.post('/api/v1/admin/site/links').set('x-csrf-token',csrf).send({group:'POLICY',label:'Privacy Policy',destination:'https://example.org/privacy',sortOrder:0,visible:false}).expect(201);
 assert.equal((await request(app).get('/api/v1/site/footer').expect(200)).body.footer.links.length,0);
 await agent.patch('/api/v1/admin/site/links/'+createdPolicy.body.id).set('x-csrf-token',csrf).send({visible:true}).expect(200);
 assert.equal((await request(app).get('/api/v1/site/footer').expect(200)).body.footer.links[0].label,'Privacy Policy');
 await agent.delete('/api/v1/admin/site/links/'+createdPolicy.body.id).set('x-csrf-token',csrf).expect(204);
 assert.equal((await request(app).get('/api/v1/site/footer').expect(200)).body.footer.links.length,0);
});
