import React, {useEffect, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import Brand from './Brand.jsx';
import {Icon} from './Icon.jsx';
import {primaryLinks} from '../content/sitePreview.js';

export default function Header(){
 const location=useLocation();
 const [expanded,setExpanded]=useState(false);
 const [active,setActive]=useState('home');
 useEffect(()=>{setExpanded(false);},[location.pathname,location.hash]);
 useEffect(()=>{
   const ids=['home','about','gallery','query-calendar','facilities','vendors','reviews','faq','contact'];
   const available=ids.map(id=>document.getElementById(id)).filter(Boolean);
   if(!available.length)return;
   const obs=new IntersectionObserver(entries=>{
     if(location.pathname!=='/')return;
     const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
     if(visible.length)setActive(visible[0].target.id);
   },{rootMargin:'-16% 0px -55% 0px',threshold:[0,0.1,0.3,0.6]});
   available.forEach(el=>obs.observe(el));
   return ()=>obs.disconnect();
 },[location.pathname]);
 useEffect(()=>{
  if(location.pathname!=='/'||!location.hash)return;
  const id=decodeURIComponent(location.hash.slice(1));
  const el=document.getElementById(id);
  if(!el)return;
  const frame=requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'start'}));
  return ()=>cancelAnimationFrame(frame);
 },[location.pathname,location.hash]);
 const close=()=>setExpanded(false);
 const nav=<>{primaryLinks.map(({hash,label})=><Link onClick={close} key={hash} className={'nav-link '+(active===hash && location.pathname==='/'?'is-active':'')} to={'/#'+hash}>{label}</Link>)}</>;
 return <header className="site-header" id="site-header">
  <div className="header-inner container-wide">
   <Brand/>
   <nav className="desktop-nav" aria-label="Primary navigation">{nav}</nav>
   <button className="menu-toggle" aria-expanded={expanded} aria-controls="mobile-nav" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'Close menu':'Open menu'}><Icon name={expanded?'close':'menu'} size={25}/></button>
  </div>
  {expanded&&<nav id="mobile-nav" className="mobile-nav" aria-label="Mobile primary navigation">{nav}</nav>}
 </header>;
}
