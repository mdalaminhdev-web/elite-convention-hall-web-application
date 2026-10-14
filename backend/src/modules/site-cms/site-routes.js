import {Router} from 'express';
import {z} from 'zod';

const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const bad=(res,status,code,message)=>res.status(status).json({error:{code,message}});
const text=max=>z.string().trim().max(max);
const required=max=>z.string().trim().min(1).max(max);
const ctaDestination=z.string().trim().regex(/^(?:#[a-z][a-z0-9-]*|\/#[a-z][a-z0-9-]*|\/inquiry)$/i,'Choose an approved website destination');
const mediaId=z.string().regex(/^[1-9]\d{0,18}$/).nullable();
const id=z.string().regex(/^[1-9]\d{0,18}$/);
const order=z.number().int().min(0).max(1000000);
const safeDestination=z.string().trim().max(2048).refine(v=>/^\/(?!\/)[a-zA-Z0-9/_#?=&%-]*$/.test(v)||/^#[a-z][a-z0-9-]*$/i.test(v)||(/^https:\/\/[^\s]+$/i.test(v)&&(()=>{try{const u=new URL(v);return u.protocol==='https:'&&Boolean(u.hostname);}catch{return false;}})()),'Use a safe local or HTTPS URL');
const schema={
  hero:z.object({tagline:text(200),mainHeading:required(300),supportingDescription:text(10000),ctaText:required(120),ctaDestination:ctaDestination,ctaSupportingNote:text(500),backgroundMediaId:mediaId}).strict(),
  about:z.object({sectionHeading:required(255),introduction:text(10000),brandStory:text(10000),serviceApproach:text(10000),experienceStrengths:text(10000),brandValues:text(10000)}).strict(),
  footer:z.object({brandDescription:text(10000),copyrightText:text(500),logoMediaId:mediaId}).strict(),
  brand:z.object({brandName:required(160),logoMediaId:mediaId}).strict(),
  highlights:z.object({title:required(160),description:text(500),iconKey:text(80),sortOrder:order,visible:z.boolean()}).strict(),
  images:z.object({mediaId:id,caption:text(500),sortOrder:order,visible:z.boolean()}).strict(),
  links:z.object({group:z.enum(['QUICK','POLICY','OTHER']),label:required(160),destination:safeDestination,sortOrder:order,visible:z.boolean()}).strict(),
};
const mediaField={hero:'backgroundMediaId',footer:'logoMediaId',brand:'logoMediaId',images:'mediaId'};
function parse(res,shape,body){const r=shape.safeParse(body);if(!r.success){bad(res,400,'VALIDATION_ERROR',r.error.issues[0]?.message||'Invalid input');return null;}return r.data;}
async function validateMedia(repo,entity,data,res){const key=mediaField[entity];if(!key||data[key]==null)return true;if(await repo.validMediaId(data[key]))return true;bad(res,400,'INVALID_MEDIA','Upload an approved image first');return false;}
function sqlError(err,res,next){if(err?.code==='ER_NO_REFERENCED_ROW_2')return bad(res,400,'INVALID_REFERENCE','Referenced image does not exist');return next(err);}

export function publicSiteRoutes(repo){const r=Router();r.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
  r.get('/hero',asyncRoute(async(_req,res)=>res.json({hero:await repo.getHero(false)})));
  r.get('/about',asyncRoute(async(_req,res)=>res.json({about:await repo.getAbout(false)})));
  r.get('/footer',asyncRoute(async(_req,res)=>res.json({footer:await repo.getFooter(false)})));
  return r;
}
export function adminSiteRoutes(repo){const r=Router();
  for(const entity of ['hero','about','footer','brand']){
    const getter=entity==='hero'?()=>repo.getHero(true):entity==='about'?()=>repo.getAbout(true):entity==='brand'?async()=> (await repo.getFooter(true)).brand:()=>repo.getFooter(true);
    r.get('/'+entity,asyncRoute(async(_req,res)=>res.json({data:await getter()})));
    r.patch('/'+entity,asyncRoute(async(req,res,next)=>{const data=parse(res,schema[entity].partial().strict(),req.body);if(!data)return;if(!Object.keys(data).length)return bad(res,400,'VALIDATION_ERROR','No fields provided');
      if(!await validateMedia(repo,entity,data,res))return;try{await repo.saveSingleton(entity,data,req.admin.id);return res.json({data:await getter()});}catch(e){sqlError(e,res,next);}
    }));
  }
  for(const entity of ['highlights','images','links']){
    r.get('/'+entity,asyncRoute(async(_req,res)=>res.json({items:await repo.listChildren(entity,true)})));
    r.post('/'+entity,asyncRoute(async(req,res,next)=>{const data=parse(res,schema[entity],req.body);if(!data)return;
      if(!await validateMedia(repo,entity,data,res))return;try{const identifier=await repo.createChild(entity,data,req.admin.id);return res.status(201).json({id:identifier});}catch(e){sqlError(e,res,next);}
    }));
    r.patch('/'+entity+'/:id',asyncRoute(async(req,res,next)=>{const identifier=parse(res,id,req.params.id);if(!identifier)return;const data=parse(res,schema[entity].partial().strict(),req.body);if(!data)return;if(!Object.keys(data).length)return bad(res,400,'VALIDATION_ERROR','No fields provided');
      if(!await validateMedia(repo,entity,data,res))return;try{const updated=await repo.updateChild(entity,identifier,data,req.admin.id);return updated?res.json({saved:true}):bad(res,404,'NOT_FOUND','Record not found');}catch(e){sqlError(e,res,next);}
    }));
    r.delete('/'+entity+'/:id',asyncRoute(async(req,res,next)=>{const identifier=parse(res,id,req.params.id);if(!identifier)return;
      const removed=await repo.deleteChild(entity,identifier,req.admin.id);return removed?res.status(204).end():bad(res,404,'NOT_FOUND','Record not found');
    }));
  }
  return r;
}
