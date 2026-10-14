import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import {createApp} from '../src/app.js';

const password='correct-admin-password';
const passwordHash=await bcrypt.hash(password,4); // Fixture only. Provisioning uses higher bcrypt cost.
const user={id:'1',full_name:'Admin',email:'admin@example.test',is_active:1,password_hash:passwordHash};
const exampleAlbum={id:'1',title:'Wedding Stage Setup',slug:'wedding-stage-setup',description:'Approved venue photo collection',coverMediaId:'9',coverUrl:'/media/gallery/11111111-1111-4111-8111-111111111111.webp',featured:true,published:true,sortOrder:0,photoCount:0};
function setup(){
  let saved={...exampleAlbum};let storedPhotos=[];
  const repo={
    async findByEmail(email){return email===user.email?user:null;},
    async findById(id){return String(id)===user.id?user:null;},
    async recordSuccessfulLogin(){},
  };
  const gallery={
    async listPublic({featured}){return (!featured||saved.featured)&&saved.published?[saved]:[];},
    async publicAlbum(slug){return saved.published&&slug===saved.slug?{album:saved,photos:storedPhotos.filter(p=>p.published)}:null;},
    async listAdmin(){return [saved];},
    async adminAlbum(id){return String(id)===saved.id?{album:saved,photos:storedPhotos}:null;},
    async isGalleryMedia(id){return ['9','10'].includes(String(id));},
    async isPublicImageKey(){return false;},
    async createAlbum(a){saved={...saved,...a,id:'1'};return '1';},
    async updateAlbum(id,a){saved={...saved,...a};return true;},
    async deleteAlbum(){saved={...saved,published:false};return true;},
    async insertMedia(){return '10';},
    async addPhoto(id,data){const photo={id:String(storedPhotos.length+1),albumId:id,mediaId:data.mediaId,url:'/media/gallery/11111111-1111-4111-8111-111111111111.webp',caption:data.caption,altText:data.altText,published:data.published,sortOrder:storedPhotos.length};storedPhotos.push(photo);return photo.id;},
    async updatePhoto(_id,pid,data){const i=storedPhotos.findIndex(x=>x.id===pid);storedPhotos[i]={...storedPhotos[i],...data};return true;},
    async deletePhoto(_id,pid){storedPhotos=storedPhotos.filter(x=>x.id!==pid);return true;},
    async reorderPhotos(_id,photoIds){if(photoIds.length!==storedPhotos.length||new Set(photoIds).size!==photoIds.length||!photoIds.every(id=>storedPhotos.some(x=>x.id===id)))return false;storedPhotos=photoIds.map((id,i)=>({...storedPhotos.find(x=>x.id===id),sortOrder:i}));return true;}
  };
  const mediaService={async create(){return {id:'10',url:'/media/gallery/11111111-1111-4111-8111-111111111111.webp',width:600,height:400};}};
  return {app:createApp({sessionStore:new session.MemoryStore(),repository:repo,gallery,mediaService})};
}
async function login(agent){
 const token=(await agent.get('/api/v1/admin/auth/csrf').expect(200)).body.csrfToken;
 const reply=await agent.post('/api/v1/admin/auth/login').set('x-csrf-token',token).send({email:user.email,password}).expect(200);
 return reply.body.csrfToken;
}

test('public Gallery lists published albums and blocks unknown albums',async()=>{
 const {app}=setup();
 const listing=await request(app).get('/api/v1/gallery/albums?featured=true').expect(200);
 assert.equal(listing.body.albums[0].title,'Wedding Stage Setup');
 const details=await request(app).get('/api/v1/gallery/albums/wedding-stage-setup').expect(200);
 assert.equal(details.body.photos.length,0);
 await request(app).get('/api/v1/gallery/albums/unknown-album').expect(404);
});
test('Admin Gallery operations require authentication and CSRF',async()=>{
 const {app}=setup();
 await request(app).get('/api/v1/admin/gallery/albums').expect(401);
 const agent=request.agent(app);const token=await login(agent);
 const list=await agent.get('/api/v1/admin/gallery/albums').expect(200);assert.equal(list.body.albums.length,1);
 await agent.patch('/api/v1/admin/gallery/albums/1').send({title:'Changed'}).expect(403);
 await agent.patch('/api/v1/admin/gallery/albums/1').set('x-csrf-token',token).send({published:true,coverMediaId:null}).expect(400);
 const change=await agent.patch('/api/v1/admin/gallery/albums/1').set('x-csrf-token',token).send({title:'Updated Title'}).expect(200);
 assert.equal(change.body.album.title,'Updated Title');
 await agent.patch('/api/v1/admin/gallery/albums/1').set('origin','https://evil.example').set('x-csrf-token',token).send({title:'Invalid'}).expect(403);
});
test('Admin photo management validates media, supports reordering and publish controls',async()=>{
 const {app}=setup();const agent=request.agent(app);const token=await login(agent);
 const headers={'x-csrf-token':token};
 await agent.post('/api/v1/admin/gallery/albums/1/photos').set(headers).send({mediaId:'123'}).expect(400);
 const one=await agent.post('/api/v1/admin/gallery/albums/1/photos').set(headers).send({mediaId:'9',caption:'First',altText:'Floral stage',published:true}).expect(201);
 const two=await agent.post('/api/v1/admin/gallery/albums/1/photos').set(headers).send({mediaId:'10',caption:'Second',altText:'Dining room',published:false}).expect(201);
 await agent.put('/api/v1/admin/gallery/albums/1/photos/order').set(headers).send({photoIds:['999']}).expect(409);
 const sorted=await agent.put('/api/v1/admin/gallery/albums/1/photos/order').set(headers).send({photoIds:[two.body.photoId,one.body.photoId]}).expect(200);
 assert.equal(sorted.body.photos[0].caption,'Second');
 const visible=await agent.get('/api/v1/gallery/albums/wedding-stage-setup').expect(200);assert.equal(visible.body.photos.length,1);
 const edited=await agent.patch(`/api/v1/admin/gallery/albums/1/photos/${two.body.photoId}`).set(headers).send({published:true}).expect(200);
 assert.equal(edited.body.photos.filter(p=>p.published).length,2);
 await agent.delete(`/api/v1/admin/gallery/albums/1/photos/${one.body.photoId}`).set(headers).expect(204);
});
