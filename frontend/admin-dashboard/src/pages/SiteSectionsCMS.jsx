import React,{useEffect,useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext.jsx';
import {siteAdminApi} from '../api/site.js';
import './site-sections-cms.css';

const errorText=e=>e?.response?.data?.error?.message||e?.message||'Unable to complete this request.';
const field=(key,label,type='text',max=500)=>({key,label,type,max});
const singletonFields={
 hero:[field('tagline','Hero tagline','text',200),field('mainHeading','Main heading','text',300),field('supportingDescription','Supporting description','textarea',10000),field('ctaText','Primary CTA label','text',120),field('ctaDestination','CTA destination (#query-calendar, /#query-calendar or /inquiry)','text',512),field('ctaSupportingNote','Availability clarification note','textarea',500),field('backgroundMediaId','Hero background image','media')],
 about:[field('sectionHeading','Section heading','text',255),field('introduction','Introduction','textarea',10000),field('brandStory','Brand story','textarea',10000),field('serviceApproach','Service approach','textarea',10000),field('experienceStrengths','Experience / strengths','textarea',10000),field('brandValues','Brand values','textarea',10000)],
 footer:[field('brandDescription','Footer brand description','textarea',10000),field('copyrightText','Copyright text','text',500),field('logoMediaId','Footer-specific logo (optional)','media')],
 brand:[field('brandName','Official brand name','text',160),field('logoMediaId','Official website logo','media')],
};
const listFields={
 highlights:[field('title','Highlight title','text',160),field('description','Short description','textarea',500),field('iconKey','Icon key (optional)','text',80),field('sortOrder','Display order','number'),field('visible','Visible','boolean')],
 images:[field('mediaId','Venue image','media'),field('caption','Image caption','text',500),field('sortOrder','Display order','number'),field('visible','Visible','boolean')],
 links:[field('group','Link group','enum'),field('label','Link label','text',160),field('destination','Link destination: /path, #section or https://','text',2048),field('sortOrder','Display order','number'),field('visible','Visible','boolean')],
};
const blank={
 highlights:{title:'',description:'',iconKey:'',sortOrder:0,visible:true},
 images:{mediaId:null,caption:'',sortOrder:0,visible:true},
 links:{group:'QUICK',label:'',destination:'',sortOrder:0,visible:true},
};
function FormInput({field:spec,value,change,upload,busy,preview}){
 const id='site-'+spec.key;
 if(spec.type==='boolean')return <label className="site-cms-check"><input id={id} type="checkbox" checked={!!value} onChange={e=>change(spec.key,e.target.checked)}/>{spec.label}</label>;
 if(spec.type==='media')return <div className="site-cms-control"><label htmlFor={id}>{spec.label}</label><input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)upload(file,spec.key);e.target.value='';}}/><div className="site-cms-media-note">{value?'Uploaded media selected — save to apply':'No uploaded media selected'}{preview&&<img src={preview} alt="Selected image preview"/>}</div>{value&&spec.key!=='mediaId'&&<button className="site-cms-minor" type="button" disabled={busy} onClick={()=>change(spec.key,null)}>Clear selection</button>}</div>;
 if(spec.type==='enum')return <label className="site-cms-control" htmlFor={id}>{spec.label}<select id={id} value={value||'QUICK'} onChange={e=>change(spec.key,e.target.value)}>{['QUICK','POLICY','OTHER'].map(k=><option key={k} value={k}>{k}</option>)}</select></label>;
 if(spec.type==='textarea')return <label className="site-cms-control wide" htmlFor={id}>{spec.label}<textarea id={id} rows={4} maxLength={spec.max} value={value??''} onChange={e=>change(spec.key,e.target.value)}/></label>;
 return <label className="site-cms-control" htmlFor={id}>{spec.label}<input id={id} type={spec.type} min={spec.type==='number'?0:undefined} step={spec.type==='number'?1:undefined} maxLength={spec.max} value={value??''} onChange={e=>change(spec.key,spec.type==='number'?Number(e.target.value||0):e.target.value)}/></label>;
}
function SingletonEditor({api,entity,label,description}){
 const [form,setForm]=useState(null),[previews,setPreviews]=useState({}),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;setForm(null);setError('');api.get(entity).then(d=>{if(active){setForm(d);setPreviews({backgroundMediaId:d.backgroundUrl,logoMediaId:d.logoUrl});}}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[api,entity]);
 const change=(key,value)=>setForm(prev=>({...prev,[key]:value}));
 async function upload(file,key){setUploading(true);setError('');try{const image=await api.upload(file,`${label} image`);change(key,image.id);setPreviews(prev=>({...prev,[key]:image.url}));setNotice('Image uploaded. Save the section to use it publicly.');}catch(e){setError(errorText(e));}finally{setUploading(false);}}
 async function save(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{const payload=Object.fromEntries(singletonFields[entity].map(f=>[f.key,form[f.key]??(f.type==='media'?null:'')]));const d=await api.save(entity,payload);setForm(d);setPreviews({backgroundMediaId:d.backgroundUrl,logoMediaId:d.logoUrl});setNotice('Saved successfully. Public content now uses the stored values.');}catch(e){setError(errorText(e));}finally{setBusy(false);}}
 return <section className="site-cms-panel"><header><h2>{label}</h2><p>{description}</p></header>{error&&<p role="alert" className="site-cms-alert error">{error}</p>}{notice&&<p role="status" className="site-cms-alert success">{notice}</p>}{form?<form onSubmit={save} className="site-cms-form">{singletonFields[entity].map(f=><FormInput key={f.key} field={f} value={form[f.key]} change={change} upload={upload} busy={busy||uploading} preview={previews[f.key]}/>)}<div className="site-cms-actions"><button className="site-cms-save" type="submit" disabled={busy||uploading}>{busy?'Saving…':'Save '+label}</button></div></form>:!error&&<p>Loading saved website content…</p>}</section>;
}
function ListEditor({api,entity,title,description}){
 const [items,setItems]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({...blank[entity]}),[previews,setPreviews]=useState({}),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function reload(){setItems(await api.list(entity));}
 useEffect(()=>{let active=true;setSelected(null);setForm({...blank[entity]});setLoading(true);setError('');api.list(entity).then(list=>{if(active)setItems(list);}).catch(e=>{if(active)setError(errorText(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[api,entity]);
 function choose(item){setSelected(item?.id??null);setForm(item?Object.fromEntries(listFields[entity].map(f=>[f.key,item[f.key]??blank[entity][f.key]])):{...blank[entity]});setPreviews(item?{mediaId:item.url}:{});setNotice('');setError('');}
 const change=(key,value)=>setForm(prev=>({...prev,[key]:value}));
 async function upload(file,key){setUploading(true);setError('');try{const m=await api.upload(file,form.caption||title);change(key,m.id);setPreviews(p=>({...p,[key]:m.url}));setNotice('Image uploaded; save this record to publish it.');}catch(e){setError(errorText(e));}finally{setUploading(false);}}
 async function save(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{if(entity==='images'&&!form.mediaId)throw new Error('Upload an image first.');if(selected)await api.update(entity,selected,form);else await api.create(entity,form);await reload();choose(null);setNotice('Record saved. Visibility controls what appears on the public website.');}catch(e){setError(errorText(e));}finally{setBusy(false);}}
 async function remove(){if(!selected||!window.confirm('Permanently delete this item?'))return;setBusy(true);setError('');try{await api.remove(entity,selected);await reload();choose(null);setNotice('Record deleted.');}catch(e){setError(errorText(e));}finally{setBusy(false);}}
 return <section className="site-cms-panel"><header><h2>{title}</h2><p>{description}</p></header>{error&&<p role="alert" className="site-cms-alert error">{error}</p>}{notice&&<p role="status" className="site-cms-alert success">{notice}</p>}<div className="site-cms-list-layout"><aside className="site-cms-items"><button className="site-cms-new" type="button" onClick={()=>choose(null)}>+ New item</button>{loading?<p>Loading…</p>:items.length===0?<p>No entries. Add approved content when available.</p>:items.map(x=><button type="button" className={selected===x.id?'selected':''} key={x.id} onClick={()=>choose(x)}><strong>{x.title||x.caption||x.label||'Image '+x.id}</strong><span>{x.visible?'Visible':'Hidden'} · Order {x.sortOrder}</span></button>)}</aside><form className="site-cms-form" onSubmit={save}><h3>{selected?'Edit selected item':'Create item'}</h3>{listFields[entity].map(f=><FormInput key={f.key} field={f} value={form[f.key]} change={change} upload={upload} busy={busy||uploading} preview={previews[f.key]}/>)}<div className="site-cms-actions"><button className="site-cms-save" type="submit" disabled={busy||uploading}>{busy?'Saving…':'Save Item'}</button>{selected&&<button className="site-cms-delete" type="button" disabled={busy||uploading} onClick={remove}>Delete</button>}</div></form></div></section>;
}
const tabs=[['hero','Hero Section'],['about','About Us'],['footer','Footer & Branding']];
export default function SiteSectionsCMS(){
 const {csrf}=useAuth(),api=useMemo(()=>siteAdminApi(csrf),[csrf]);
 const [params,setParams]=useSearchParams();const chosen=params.get('tab');const tab=tabs.some(([k])=>k===chosen)?chosen:'hero';
 return <main className="site-cms-root"><header className="site-cms-top"><div><p>ELITE CONVENTION HALL / CONTENT MANAGEMENT</p><h1>Hero, About & Footer</h1><span>Manage the public website’s principal content without changing source code.</span></div><Link to="/dashboard">← Dashboard</Link></header>
 <nav aria-label="Website content editor sections" className="site-cms-tabs">{tabs.map(([key,name])=><button className={tab===key?'active':''} type="button" key={key} onClick={()=>setParams({tab:key})}>{name}</button>)}</nav>
 {tab==='hero'&&<SingletonEditor key="hero" api={api} entity="hero" label="Hero Section" description="Edit the landing message, button destination, supporting availability clarification and background image."/>}
 {tab==='about'&&<><SingletonEditor key="about" api={api} entity="about" label="About Us" description="Maintain the introduction, brand story, service approach, strengths and values."/><ListEditor key="highlights" api={api} entity="highlights" title="About Highlights" description="Ordered value cards with optional icons; hidden cards are excluded publicly."/><ListEditor key="images" api={api} entity="images" title="About Photography" description="Upload approved venue photographs; control captions, order and visibility."/></>}
 {tab==='footer'&&<><SingletonEditor key="brand" api={api} entity="brand" label="Website Branding" description="Official website brand name and logo, used in the Header and Footer."/><SingletonEditor key="footer" api={api} entity="footer" label="Footer Content" description="Footer introduction, optional dedicated footer logo and approved copyright text."/><ListEditor key="links" api={api} entity="links" title="Footer Navigation & Policies" description="Manage QUICK links and approved POLICY/OTHER destinations; external links must be HTTPS."/></>}
 <p className="site-cms-note">Important: Upload only client-approved original images, policy destinations and branding. PRD preview screenshots must be replaced before production.</p>
 </main>;
}
