import React from 'react';
import {Icon} from '../components/Icon.jsx';
import {about as preview,media} from '../content/sitePreview.js';
import {useSiteSection} from '../hooks/useSiteSection.js';
export default function About(){
 const {value:cms}=useSiteSection('about');
 const title=cms?cms.sectionHeading:'About Elite Convention Hall';
 const highlights=cms?cms.highlights:preview.highlights.map(x=>({title:x.title,description:x.description,iconKey:x.icon}));
 const photos=cms?.images?.length?cms.images:(import.meta.env.DEV?preview.photos.map(x=>({id:x.label,url:x.src,caption:x.label,altText:'PRD visual reference: '+x.label})):[]);
 const intro=cms?cms.introduction:preview.intro;
 const story=cms?cms.brandStory:preview.story;
 return <section className="about-section" id="about" aria-labelledby="about-title">
  <div className="about-backdrop" style={{backgroundImage:`linear-gradient(90deg,#100d09 0%,rgba(16,13,9,.92) 34%,rgba(16,13,9,.30) 74%,rgba(16,13,9,.08)), url('${photos[0]?.url||(import.meta.env.DEV?media.about:'')}')`}} aria-hidden="true"/>
  <div className="container-wide about-content"><div className="about-intro">
   <p className="section-kicker"><span>✧</span> About Us <span>✧</span></p>
   <h2 id="about-title">{title}</h2><div className="short-rule" aria-hidden="true"/>
   {intro&&<p>{intro}</p>}{story&&<p>{story}</p>}
   {cms?.serviceApproach&&<p>{cms.serviceApproach}</p>}
   {cms?.experienceStrengths&&<p>{cms.experienceStrengths}</p>}
   {cms?.brandValues&&<p>{cms.brandValues}</p>}
  </div>
  {highlights.length>0&&<div className="about-highlights" aria-label="Venue highlights">{highlights.map(item=><article className="highlight" key={item.id||item.title}><span className="highlight-icon"><Icon name={item.iconKey||'spark'} size={24}/></span><div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div>}
  {photos.length>0&&<div className="about-gallery" aria-label="Venue photography">{photos.map(photo=><figure className="about-photo" key={photo.id||photo.url}><img src={photo.url} alt={photo.altText||photo.caption||'Venue photography'} loading="lazy"/><figcaption>{photo.caption}</figcaption></figure>)}</div>}
  </div>
 </section>;
}
