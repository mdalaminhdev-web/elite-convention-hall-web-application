import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';

const validIsoDate = text => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return false;
  const [year,month,day]=text.split('-').map(Number);
  return year>=1000 && year<=9999 && month>=1 && month<=12 && day>=1 &&
    new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)===text;
};
const dateSchema=z.string().refine(validIsoDate,'Date must be a valid YYYY-MM-DD calendar date');
const monthSchema=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).refine(value=>Number(value.slice(0,4))>=1000);
const name=z.string().trim().min(2).max(150);
const phone=z.string().trim().min(7).max(32).refine(s=>/^[+0-9()\s-]+$/.test(s) && (s.match(/\d/g)||[]).length>=7 && (s.match(/\d/g)||[]).length<=15,'Enter a valid phone number');
const optional=max=>z.string().trim().max(max).default('');
const inquirySchema=z.object({
  submissionKey:z.uuid(),fullName:name,phoneNumber:phone,
  email:z.union([z.email().max(254),z.literal('')]).default(''),
  eventDate:dateSchema,preferredShift:z.enum(['DAY','NIGHT']),
  eventType:optional(120),guestCount:z.union([z.number().int().min(1).max(100000),z.null()]).default(null),
  companyOrganization:optional(200),additionalDetails:optional(5000),
}).strict();
const asyncRoute=handler=>(req,res,next)=>Promise.resolve(handler(req,res,next)).catch(next);
const fail=(res,status,code,message)=>res.status(status).json({error:{code,message}});
function validate(res,schema,data){const r=schema.safeParse(data);if(!r.success){fail(res,400,'VALIDATION_ERROR',r.error.issues[0]?.message||'Invalid request');return null;}return r.data;}
const todayRangeLimit=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false,handler:(_req,res)=>fail(res,429,'INQUIRY_RATE_LIMIT','Too many inquiry submissions. Please try later.')});

export function publicInquiryRoutes(repository){
  const router=Router();
  router.get('/calendar',asyncRoute(async(req,res)=>{
    const month=validate(res,monthSchema,req.query.month);if(!month)return;
    res.setHeader('Cache-Control','no-store');
    return res.json(await repository.publicMonth(month));
  }));
  router.post('/',todayRangeLimit,asyncRoute(async(req,res)=>{
    const payload=validate(res,inquirySchema,req.body);if(!payload)return;
    const result=await repository.insertInquiry(payload);
    // Do not disclose client data in the public response.
    res.setHeader('Cache-Control','no-store');
    return res.status(result.duplicate?200:201).json({received:true,reference:result.id,duplicate:result.duplicate,
      message:'Inquiry received successfully. Our team will review it and confirm actual venue availability.'});
  }));
  return router;
}
export function adminInquiryRoutes(repository){
  const router=Router();
  router.get('/summary',asyncRoute(async(_req,res)=>res.json(await repository.adminSummary())));
  router.get('/dashboard',asyncRoute(async(_req,res)=>res.json(await repository.adminDashboard())));
  router.get('/',asyncRoute(async(req,res)=>{
    const criteria=validate(res,z.object({page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),search:z.string().trim().max(100).default(''),eventDate:z.union([dateSchema,z.literal('')]).default(''),shift:z.enum(['DAY','NIGHT','']).default('')}).strict(),req.query);
    if(!criteria)return;
    return res.json(await repository.adminList(criteria));
  }));
  router.get('/:id',asyncRoute(async(req,res)=>{
    const id=validate(res,z.string().regex(/^[1-9]\d{0,18}$/),req.params.id);if(!id)return;
    const result=await repository.adminGet(id);
    return result?res.json({inquiry:result}):fail(res,404,'NOT_FOUND','Inquiry not found');
  }));
  return router;
}
export function adminCalendarRoutes(repository){
  const router=Router();
  router.get('/settings',asyncRoute(async(_req,res)=>res.json(await repository.adminSettings())));
  router.patch('/settings',asyncRoute(async(req,res)=>{
    const data=validate(res,z.object({mode:z.enum(['REAL','MANUAL','HIDDEN'])}).strict(),req.body);if(!data)return;
    return res.json(await repository.adminSetMode(data.mode,req.admin.id));
  }));
  router.get('/manual-counts',asyncRoute(async(req,res)=>{
    const month=validate(res,monthSchema,req.query.month);if(!month)return;
    return res.json({month,counts:await repository.adminManualCounts(month)});
  }));
  router.put('/manual-counts/:date',asyncRoute(async(req,res)=>{
    const date=validate(res,dateSchema,req.params.date);if(!date)return;
    const payload=validate(res,z.object({count:z.number().int().min(0).max(4294967295)}).strict(),req.body);if(!payload)return;
    return res.json(await repository.adminUpsertCount(date,payload.count,req.admin.id));
  }));
  router.delete('/manual-counts/:date',asyncRoute(async(req,res)=>{
    const date=validate(res,dateSchema,req.params.date);if(!date)return;
    const removed=await repository.adminDeleteCount(date,req.admin.id);
    return removed?res.status(204).end():fail(res,404,'NOT_FOUND','No manual count stored for this date');
  }));
  return router;
}
