/** Non-destructive API smoke tests against an ALREADY RUNNING dev/staging server. */
import assert from 'node:assert/strict';
const base=(process.env.API_BASE_URL||'http://127.0.0.1:4000').replace(/\/$/,'');
const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit'}).formatToParts(new Date());
const month=parts.find(x=>x.type==='year').value+'-'+parts.find(x=>x.type==='month').value;
const checks=[
 ['health','/api/v1/health',200,obj=>assert.equal(obj.status,'ok')],
 ['site Hero','/api/v1/site/hero',200,obj=>assert.ok(obj.hero)],
 ['site About','/api/v1/site/about',200,obj=>assert.ok(obj.about)],
 ['site Footer','/api/v1/site/footer',200,obj=>assert.ok(obj.footer)],
 ['published gallery','/api/v1/gallery/albums',200,obj=>assert.ok(Array.isArray(obj.albums))],
 ['public facilities','/api/v1/content/facilities',200,obj=>assert.ok(Array.isArray(obj.items))],
 ['public vendors','/api/v1/content/vendors',200,obj=>assert.ok(Array.isArray(obj.items))],
 ['public reviews','/api/v1/content/reviews',200,obj=>assert.ok(Array.isArray(obj.items))],
 ['public FAQs','/api/v1/content/faqs',200,obj=>assert.ok(Array.isArray(obj.items))],
 ['public contact','/api/v1/content/contact',200,obj=>assert.ok(obj.contact)],
 ['public calendar',`/api/v1/inquiries/calendar?month=${month}`,200,obj=>{
   assert.equal(obj.month,month);
   assert.ok(['REAL','MANUAL','HIDDEN'].includes(obj.mode));
   assert.ok(Array.isArray(obj.counts));
   if(obj.mode==='HIDDEN')assert.equal(obj.counts.length,0);
   assert.equal(new Set(obj.counts.map(c=>c.date)).size,obj.counts.length);
   for(const c of obj.counts){assert.match(c.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(Number.isSafeInteger(c.count)&&c.count>=0);}
 }],
 ['Admin API protected','/api/v1/admin/inquiries',401,obj=>assert.equal(obj.error?.code,'UNAUTHORIZED')],
];
let passed=0,failed=0;
for(const [name,url,expected,check] of checks){
 try{
  const reply=await fetch(base+url,{headers:{accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(8000)});
  assert.equal(reply.status,expected,`${name}: expected HTTP ${expected}, got ${reply.status}`);
  const text=await reply.text();const json=JSON.parse(text);check(json);
  console.log('PASS',name);passed++;
 }catch(err){failed++;console.error('FAIL',name,err.message);}
}
console.log(`Live read-only API checks: ${passed} passed; ${failed} failed. Target: ${base}`);
if(failed)process.exitCode=1;
