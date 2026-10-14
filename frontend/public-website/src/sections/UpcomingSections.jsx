import React from 'react';
import {Link} from 'react-router-dom';
import {Icon} from '../components/Icon.jsx';
const pending=[
 {id:'facilities',overline:'Facilities & Amenities',title:'Discover the Space',description:'Only verified venue facilities, capacity information and supporting images will be displayed here after CMS integration.',step:'Phase 9'},
 {id:'vendors',overline:'Our Event Partners',title:'Trusted Vendors',description:'Approved event service partners, their details and any confirmed promotions will be displayed in this section.',step:'Phase 9'},
 {id:'reviews',overline:'Client Reviews',title:'What Our Clients Say',description:'This section will display authentic, approved client testimonials after content confirmation.',step:'Phase 9'},
 {id:'faq',overline:'Frequently Asked Questions',title:'Your Questions Answered',description:'Client-approved questions and answers will be managed and published through the CMS.',step:'Phase 9'},
 {id:'contact',overline:'Contact Us',title:'Get in Touch',description:'Official telephone, WhatsApp, email, address and venue map will appear once the client supplies their verified contact details.',step:'Phase 9'},
];
export default function UpcomingSections(){return pending.map(({id,overline,title,description,step},i)=><section id={id} key={id} aria-labelledby={id+'-heading'} className={'upcoming-section '+(i%2?'upcoming-alt':'')}>
 <div className="container-wide upcoming-layout"><div><p className="section-kicker">{overline}</p><h2 id={id+'-heading'}>{title}</h2></div><div className="upcoming-info"><span className="phase-pill">{step} · Development pending</span><p>{description}</p>{id==='query-calendar'&&<p className="upcoming-warning"><Icon name="calendar" size={16}/> No event inquiries can be submitted in this UI-only phase.</p>}</div></div>
 </section>)}
