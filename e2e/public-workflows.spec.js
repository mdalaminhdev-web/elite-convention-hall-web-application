import {test,expect} from '@playwright/test';

const todayDhaka=()=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit'}).formatToParts(new Date());
 return `${parts.find(x=>x.type==='year').value}-${parts.find(x=>x.type==='month').value}`;
};
const transparent='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

async function fakePublicApi(page,{mode='MANUAL',counts=null,albums=null,faqs=[]}={}){
 const month=todayDhaka();
 const testAlbum={id:'1',slug:'test-gallery',title:'Example Gallery Album',description:'Mock browser test album',coverUrl:null,photoCount:2,featured:true,published:true};
 const testPhotos=[
  {id:'1',albumId:'1',url:transparent,caption:'First venue photo',altText:'First test image',published:true},
  {id:'2',albumId:'1',url:transparent,caption:'Second venue photo',altText:'Second test image',published:true},
 ];
 const testAlbums=albums??[testAlbum];
 const submitted=[];
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(), url=new URL(req.url()), path=url.pathname;
  const respond=data=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  if(path==='/api/v1/inquiries/calendar')return respond({month:url.searchParams.get('month'),mode,counts:counts??[{date:`${month}-13`,count:0}]});
  if(path==='/api/v1/inquiries'&&req.method()==='POST'){
   submitted.push(req.postDataJSON());
   return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({received:true,reference:'BROWSER-FIXTURE-1',duplicate:false,message:'Inquiry received. The team will confirm availability.'})});
  }
  if(path==='/api/v1/gallery/albums')return respond({albums:testAlbums.filter(a=>url.searchParams.get('featured')==='true'?a.featured:true)});
  if(path==='/api/v1/gallery/albums/test-gallery')return respond({album:testAlbum,photos:testPhotos});
  if(path==='/api/v1/site/hero')return respond({hero:{mainHeading:'A Perfect Venue for Your Unforgettable Events',tagline:'Celebrate Your Special Moments With Us',supportingDescription:'',ctaText:'Check Venue Availability',ctaDestination:'#query-calendar',ctaSupportingNote:'Submitting an inquiry does not confirm a reservation.',backgroundUrl:null}});
  if(path==='/api/v1/site/about')return respond({about:{sectionHeading:'About Elite Convention Hall',introduction:'',brandStory:'',highlights:[],images:[]}});
  if(path==='/api/v1/site/footer')return respond({footer:{brand:{brandName:'Elite Convention Hall',logoUrl:null},links:[],brandDescription:'',copyrightText:''}});
  if(path==='/api/v1/content/contact')return respond({contact:{phone:null,whatsapp:null,email:null,venueAddress:null,mapUrl:null,contactHours:null}});
  if(path==='/api/v1/content/faqs')return respond({items:faqs});
  if(path.startsWith('/api/v1/content/'))return respond({items:[]});
  return respond({});
 });
 return {submitted,month};
}

test('manual count zero is shown, missing date stays blank, Day Shift passes into the inquiry form',async({page})=>{
 const {month}=await fakePublicApi(page);
 await page.goto('/');
 const zero=page.locator(`button[aria-label^="${month}-13."]`);
 const missing=page.locator(`button[aria-label^="${month}-14."]`);
 await expect(zero).toContainText('0 inquiries');
 await expect(missing).not.toContainText('0 inquiries');
 await missing.click();
 await expect(page.getByRole('dialog',{name:'Choose Your Preferred Shift'})).toBeVisible();
 await page.getByRole('button',{name:'Day Shift'}).click();
 await page.getByRole('button',{name:/Continue to Inquiry Form/}).click();
 await expect(page).toHaveURL(new RegExp(`/inquiry\\?date=${month}-14&shift=DAY`));
 await expect(page.locator('input[name="eventDate"]')).toHaveValue(`${month}-14`);
 await expect(page.locator('select[name="preferredShift"]')).toHaveValue('DAY');
 await expect(page.getByText('Submitting an inquiry does not create a reservation.')).toBeVisible();
});

test('public inquiry completes with real input fields and no booking confirmation',async({page})=>{
 const {submitted,month}=await fakePublicApi(page);
 await page.goto(`/inquiry?date=${month}-15&shift=NIGHT`);
 await page.locator('input[name="fullName"]').fill('Visitor Test');
 await page.locator('input[name="phoneNumber"]').fill('+8801712345678');
 await page.locator('input[name="email"]').fill('visitor@example.test');
 await page.locator('input[name="eventType"]').fill('Wedding');
 await page.locator('input[name="guestCount"]').fill('100');
 await page.getByRole('button',{name:/Submit Inquiry/}).click();
 await expect(page.getByRole('heading',{name:'Inquiry Received Successfully'})).toBeVisible();
 expect(submitted).toHaveLength(1);
 expect(submitted[0]).toMatchObject({eventDate:`${month}-15`,preferredShift:'NIGHT',fullName:'Visitor Test',guestCount:100});
 await expect(page.getByText(/confirm venue availability with you/)).toBeVisible();
});

test('Gallery lists an album and opens a two-photo keyboard-accessible lightbox',async({page})=>{
 await fakePublicApi(page);
 await page.goto('/gallery');
 await expect(page.getByRole('heading',{name:'Explore All Albums'})).toBeVisible();
 await page.getByRole('link',{name:'View Example Gallery Album album'}).click();
 await expect(page.getByRole('heading',{name:'Example Gallery Album'})).toBeVisible();
 await page.getByRole('button',{name:'View photograph 1 of 2'}).click();
 const dialog=page.getByRole('dialog',{name:'Example Gallery Album image viewer'});
 await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('1 / 2');
 await page.keyboard.press('ArrowRight');
 await expect(dialog).toContainText('2 / 2');
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
});

test('unpublished/empty Gallery shows an honest empty state',async({page})=>{
 await fakePublicApi(page,{albums:[]});
 await page.goto('/gallery');
 await expect(page.getByText('No albums have been published yet.')).toBeVisible();
});

test('FAQ expands approved content; no fabricated vendor/review data appears',async({page})=>{
 await fakePublicApi(page,{faqs:[{id:'1',question:'Is my date reserved when I inquire?',answer:'No. The venue team confirms availability after reviewing your inquiry.',categoryName:'Inquiries'}]});
 await page.goto('/');
 const faq=page.locator('details').filter({hasText:'Is my date reserved when I inquire?'});
 await faq.locator('summary').click();
 await expect(faq).toContainText('The venue team confirms availability');
 await expect(page.getByText(/Vendor profiles will appear here/)).toBeVisible();
 await expect(page.getByText(/Approved client reviews will appear here/)).toBeVisible();
});
