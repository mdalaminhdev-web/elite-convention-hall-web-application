import React from 'react';
import {Link} from 'react-router-dom';
import {Icon} from '../components/Icon.jsx';
import {hero as preview,media} from '../content/sitePreview.js';
import {useSiteSection} from '../hooks/useSiteSection.js';
function emphasisHeading(text){const parts=(text||'').trim().split(/\s+/);if(parts.length<3)return [text||'', ''];return [parts.slice(0,-2).join(' '),parts.slice(-2).join(' ')];}
function localLink(value){if(typeof value!=='string')return '/#query-calendar';if(/^#[a-z][a-z0-9-]*$/i.test(value))return '/'+value;if(/^\/(?:#[a-z][a-z0-9-]*|inquiry)$/i.test(value))return value;return '/#query-calendar';}
export default function Hero(){
 const {value:cms}=useSiteSection('hero');
 const heading=cms?cms.mainHeading:[preview.titleStart,preview.titleEmphasis].join(' ');
 const [first,last]=emphasisHeading(heading);
 const background=cms?.backgroundUrl||(import.meta.env.DEV?media.hero:null);
 return <section className="hero" id="home" aria-labelledby="hero-heading" style={{'--hero-photo':background?`url("${background}")`:'none'}}>
  <div className="hero-glow" aria-hidden="true"/>
  <div className="container-wide hero-inner"><div className="hero-copy">
   <div className="ornament" aria-hidden="true"><span/>✦<span/></div>
   <p className="hero-eyebrow">{cms?cms.tagline:preview.eyebrow}</p>
   <h1 id="hero-heading">{first}{last&&<><br/><em>{last}</em></>}</h1>
   <p className="hero-description">{cms?cms.supportingDescription:preview.description}</p>
   <Link className="btn-gold" to={localLink(cms?.ctaDestination)}>{cms?.ctaText||preview.cta}<Icon name="arrow" size={19}/></Link>
   <div className="hero-note"><Icon name="calendar" size={19}/><p>{cms?cms.ctaSupportingNote:preview.disclaimer}</p></div>
  </div></div>
  <div className="hero-bottom" aria-hidden="true"><span>ELITE CONVENTION HALL</span><span className="hero-bottom-line"/><span>WHERE MOMENTS BECOME MEMORIES</span></div>
 </section>;
}
