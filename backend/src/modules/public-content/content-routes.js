import {Router} from 'express';
import {z} from 'zod';
const id=z.string().regex(/^[1-9][0-9]{0,18}$/);
const str=(max,min=0)=>z.string().trim().min(min).max(max);
const nullable=id.nullable();
const url=z.union([z.url().max(2048).refine(v=>/^https:\/\//.test(v),'HTTPS required'),z.literal('')]);
const empty=str(5000).default('');
const positive=z.number().int().min(0).max(1_000_000).default(0);
const itemSchemas={
 facilities:z.object({name:str(200,1),description:str(5000).default(''),capacity:z.number().int().positive().max(100000).nullable().default(null),capacityNote:str(255).default(''),imageMediaId:nullable.default(null),iconKey:str(80).default(''),sortOrder:positive,published:z.boolean().default(false),amenities:z.array(str(160,1)).max(60).default([]),serviceFeatures:z.array(str(160,1)).max(60).default([])}).strict(),
 vendors:z.object({categoryId:id,name:str(200,1),shortDescription:str(500).default(''),details:empty,imageMediaId:nullable.default(null),phone:str(32).default(''),email:z.union([z.email().max(254),z.literal('')]).default(''),websiteUrl:url.default(''),socialUrl:url.default(''),promotionDetails:empty,showPromotion:z.boolean().default(false),sortOrder:positive,published:z.boolean().default(false)}).strict(),
 reviews:z.object({clientName:str(160,1),testimonial:str(5000,1),eventType:str(120).default(''),rating:z.number().int().min(1).max(5).nullable().default(null),imageMediaId:nullable.default(null),approvedSourceNote:str(500).default(''),sortOrder:positive,published:z.boolean().default(false)}).strict(),
 faqs:z.object({categoryId:nullable.default(null),question:str(500,1),answer:str(5000,1),sortOrder:positive,published:z.boolean().default(false)}).strict(),
 vendorCategories:z.object({name:str(160,1),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),sortOrder:positive,visible:z.boolean().default(true)}).strict(),
 faqCategories:z.object({name:str(160,1),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),sortOrder:positive,visible:z.boolean().default(true)}).strict(),
 social:z.object({platform:str(80,1),url:url.refine(v=>Boolean(v),'URL required'),placement:z.enum(['CONTACT','FOOTER','BOTH']).default('BOTH'),sortOrder:positive,visible:z.boolean().default(true)}).strict()
};
const contactSchema=z.object({phone:str(32).nullable().optional(),whatsapp:str(32).nullable().optional(),email:z.union([z.email().max(254),z.literal(''),z.null()]).optional(),venueAddress:str(5000).nullable().optional(),mapUrl:z.union([url,z.null()]).optional(),contactHours:str(500).nullable().optional()}).strict();
const fail=(res,status,code,message)=>res.status(status).json({error:{code,message}});
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
function validated(res,schema,data){const r=schema.safeParse(data);if(!r.success){fail(res,400,'VALIDATION_ERROR',r.error.issues[0]?.message||'Invalid input');return null;}return r.data;}
function safeError(err,res,next){if(err?.code==='ER_DUP_ENTRY')return fail(res,409,'DUPLICATE_VALUE','A record with that identifier already exists');if(err?.code==='ER_NO_REFERENCED_ROW_2'||err?.code==='ER_ROW_IS_REFERENCED_2')return fail(res,409,'RELATIONSHIP_CONFLICT','Referenced category or record cannot be modified this way');return next(err);}
export const contentSchemaFor = entity => itemSchemas[entity];
export function publicContentRoutes(repo){const r=Router();for(const entity of Object.keys(itemSchemas)){r.get('/'+entity,wrap(async(req,res)=>{res.setHeader('Cache-Control','no-store');res.json({items:await repo.list(entity,false)});}));}
 r.get('/contact',wrap(async(_req,res)=>{res.setHeader('Cache-Control','no-store');res.json({contact:await repo.getContact()});}));return r;}
export function adminContentRoutes(repo){const r=Router();for(const [entity,schema] of Object.entries(itemSchemas)){
 r.get('/'+entity,wrap(async(_req,res)=>res.json({items:await repo.list(entity,true)})));
 r.post('/'+entity,wrap(async(req,res,next)=>{const payload=validated(res,schema,req.body);if(!payload)return;
  if(payload.imageMediaId && !await repo.isContentMedia(payload.imageMediaId))return fail(res,400,'INVALID_IMAGE','Upload an approved image first');
  try{const identifier=entity==='facilities'?await repo.saveFacility(payload):await repo.create(entity,payload);res.status(201).json({id:identifier});}catch(e){safeError(e,res,next);}
 }));
 r.patch('/'+entity+'/:id',wrap(async(req,res,next)=>{const identifier=validated(res,id,req.params.id);if(!identifier)return;const payload=validated(res,schema.partial().strict(),req.body);if(!payload)return;
  if(payload.imageMediaId && !await repo.isContentMedia(payload.imageMediaId))return fail(res,400,'INVALID_IMAGE','Upload an approved image first');
  try{let updated;if(entity==='facilities'){const current=(await repo.list('facilities',true)).find(f=>f.id===identifier);updated=current?Boolean(await repo.saveFacility({...current,...payload},identifier)):false;}else{updated=await repo.update(entity,identifier,payload);}return updated?res.json({saved:true}):fail(res,404,'NOT_FOUND','Record not found');}catch(e){safeError(e,res,next);}
 }));
 r.delete('/'+entity+'/:id',wrap(async(req,res,next)=>{const identifier=validated(res,id,req.params.id);if(!identifier)return;
  try{const removed=await repo.remove(entity,identifier);return removed?res.status(204).end():fail(res,404,'NOT_FOUND','Record not found');}catch(e){safeError(e,res,next);}
 }));
 }
 r.get('/contact',wrap(async(_req,res)=>res.json({contact:await repo.getContact()})));
 r.patch('/contact',wrap(async(req,res)=>{const data=validated(res,contactSchema,req.body);if(!data)return;res.json({contact:await repo.updateContact(data,req.admin.id)});}));
 return r;
}
