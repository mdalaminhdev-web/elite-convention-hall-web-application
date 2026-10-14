import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import Brand from './Brand.jsx';
import {media} from '../content/sitePreview.js';
import {Icon} from './Icon.jsx';
import {getContent} from '../api/content.js';
import {useSiteSection} from '../hooks/useSiteSection.js';
const httpsUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:null;}catch{return null;}};
const linkInfo=href=>href?.startsWith('https://')?{external:true,url:httpsUrl(href)}:href?.startsWith('#')?{external:false,url:'/'+href}:{external:false,url:href?.startsWith('/')?href:'/'};
export default function Footer(){
 const [contact,setContact]=useState(null),[social,setSocial]=useState([]);
 const {value:site}=useSiteSection('footer');
 useEffect(()=>{let active=true;Promise.all([getContent('contact'),getContent('social')]).then(([a,b])=>{if(active){setContact(a.contact);setSocial((b.items||[]).filter(x=>x.placement==='FOOTER'||x.placement==='BOTH'));}}).catch(()=>{});return()=>{active=false;};},[]);
 const hasContact=contact?.phone||contact?.email||contact?.whatsapp||contact?.venueAddress;
 const links=site?.links||[];const quick=links.filter(x=>x.group==='QUICK');const policies=links.filter(x=>x.group==='POLICY'||x.group==='OTHER');
 const legal=site?.copyrightText||`© ${new Date().getFullYear()} Elite Convention Hall. All Rights Reserved.`;
 return <footer className="footer" aria-label="Website footer">
  <div className="footer-photo" style={{backgroundImage:`linear-gradient(180deg, rgba(14,11,8,.1),#0f0c09),${import.meta.env.DEV?`url('${media.footer}')`:'none'}`}} aria-hidden="true"/>
  <div className="container-wide footer-grid">
   <div className="footer-about"><Brand variant="brand-footer" brand={site?.brand} logoUrl={site?.logoUrl||site?.brand?.logoUrl}/><p>{site?.brandDescription||'Discover Elite Convention Hall and share your event plans with our team.'}</p><Link className="btn-outline" to="/#query-calendar">Make an Inquiry <Icon name="arrow" size={16}/></Link></div>
   <div><h2>Quick Links</h2>{quick.length?<ul>{quick.map(l=><li key={l.id}><Icon name="chevron" size={14}/><FooterLink item={l}/></li>)}</ul>:<p className="footer-muted">Approved quick links will appear here.</p>}</div>
   <div><h2>Contact Us</h2>{hasContact?<div className="footer-muted">{contact.phone&&<p><a href={'tel:'+contact.phone.replace(/[^\d+]/g,'')}>{contact.phone}</a></p>}{contact.whatsapp&&<p><a href={'https://wa.me/'+contact.whatsapp.replace(/[^\d]/g,'')} target="_blank" rel="noopener noreferrer">WhatsApp</a></p>}{contact.email&&<p><a href={'mailto:'+contact.email}>{contact.email}</a></p>}{contact.venueAddress&&<p>{contact.venueAddress}</p>}</div>:<p className="footer-muted">Official contact details will appear after approval.</p>}</div>
   <div><h2>Important Links</h2>{policies.length?<ul>{policies.map(l=><li key={l.id}><Icon name="chevron" size={14}/><FooterLink item={l}/></li>)}</ul>:<p className="footer-muted">Approved policy links will appear here.</p>}{social.length>0&&<ul>{social.filter(x=>httpsUrl(x.url)).map(x=><li key={x.id}><Icon name="chevron" size={14}/><a href={httpsUrl(x.url)} target="_blank" rel="noopener noreferrer">{x.platform}</a></li>)}</ul>}</div>
  </div>
  <div className="footer-bottom container-wide"><span>{legal}</span><span>Elite Convention Hall</span></div>
 </footer>;
}
function FooterLink({item}){const {external,url}=linkInfo(item.destination);return external?<a href={url} target="_blank" rel="noopener noreferrer">{item.label}</a>:<Link to={url}>{item.label}</Link>;}
