import React from 'react';
import {Link} from 'react-router-dom';
import {useSiteSection} from '../hooks/useSiteSection.js';
export default function Brand({variant='',brand=null,logoUrl=null}){
 const {value:site}=useSiteSection('footer');
 const official=brand||site?.brand;
 const name=official?.brandName||'Elite Convention Hall';
 const logo=logoUrl??official?.logoUrl;
 return <Link to="/#home" className={'brand '+variant} aria-label={`${name} — back to home`}>
  {logo?<img className="brand-official-logo" src={logo} alt=""/>:<span className="brand-crest" aria-hidden="true"><span className="brand-crown">♛</span><span className="brand-letter">E</span></span>}
  <span className="brand-name"><strong>{name==='Elite Convention Hall'?'ELITE':name}</strong>{name==='Elite Convention Hall'&&<span>CONVENTION HALL</span>}</span>
 </Link>;
}
