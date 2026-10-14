import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Icon} from '../components/Icon.jsx';
import {inquiryApi} from '../api/inquiries.js';

const pad=n=>String(n).padStart(2,'0');
const monthKey=(y,m)=>`${y}-${pad(m+1)}`;
const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const monthName=(year,month)=>new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(year,month,1)));
// The venue operates in Bangladesh. The initial displayed month must not depend on the visitor's timezone.
const initialDhakaMonth=()=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'numeric'}).formatToParts(new Date());
 return {year:Number(parts.find(p=>p.type==='year').value),month:Number(parts.find(p=>p.type==='month').value)-1};
};
function calendarCells(year,month){
 const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 const offset=new Date(Date.UTC(year,month,1)).getUTCDay();
 return Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>{
  const day=i-offset+1;
  return day>0&&day<=count?{day,date:`${year}-${pad(month+1)}-${pad(day)}`} : null;
 });
}
export default function QueryCalendar(){
 const [initial]=useState(initialDhakaMonth);
 const [year,setYear]=useState(initial.year);
 const [month,setMonth]=useState(initial.month);
 const [counts,setCounts]=useState({mode:'HIDDEN',counts:[]});
 const [status,setStatus]=useState('loading');const [error,setError]=useState('');
 const [selected,setSelected]=useState(null);const [shift,setShift]=useState('');
 const navigate=useNavigate();
 const dialogRef=useRef(null);const lastSelectedRef=useRef(null);
 const ym=monthKey(year,month);
 const cells=useMemo(()=>calendarCells(year,month),[year,month]);
 const lookup=useMemo(()=>new Map(counts.counts.map(c=>[c.date,c.count])),[counts]);
 useEffect(()=>{
  let live=true;setStatus('loading');setError('');
  inquiryApi.calendar(ym).then(data=>{if(live){setCounts(data);setStatus('ready');}})
   .catch(()=>{if(live){setError('Calendar inquiry activity is temporarily unavailable. You can still submit an inquiry directly.');setStatus('error');}});
  return()=>{live=false;};
 },[ym]);
 function move(delta){const next=new Date(Date.UTC(year,month+delta,1));setYear(next.getUTCFullYear());setMonth(next.getUTCMonth());}
 function choose(date){lastSelectedRef.current=document.activeElement;setSelected(date);setShift('');}
 function proceed(){if(!selected||!shift)return;navigate(`/inquiry?date=${selected}&shift=${shift}`);}
 useEffect(()=>{
   if(!selected)return;const dialog=dialogRef.current;const first=dialog?.querySelector('button');first?.focus();
   function handleKey(event){if(event.key==='Escape'){event.preventDefault();setSelected(null);return;}if(event.key==='Tab'&&dialog){const focusable=[...dialog.querySelectorAll('button:not(:disabled)')];const active=document.activeElement;const pos=focusable.indexOf(active);if(event.shiftKey&&pos===0){event.preventDefault();focusable[focusable.length-1]?.focus();}else if(!event.shiftKey&&pos===focusable.length-1){event.preventDefault();focusable[0]?.focus();}}}
   document.addEventListener('keydown',handleKey);return()=>{document.removeEventListener('keydown',handleKey);lastSelectedRef.current?.focus?.();};
 },[selected]);
 const displayCount=date=>{
  if(status!=='ready'||counts.mode==='HIDDEN')return null;
  if(counts.mode==='MANUAL'&&!lookup.has(date))return null;
  const count=lookup.get(date)??0;
  return <span className="query-day-count">{count} {count===1?'inquiry':'inquiries'}</span>;
 };
 return <section className="query-section" id="query-calendar" aria-labelledby="query-heading">
  <div className="container-wide">
   <div className="query-intro"><p className="section-kicker">EVENT INQUIRY</p><h2 id="query-heading">Plan Your Event <em>With Us</em></h2>
    <p>Explore date-wise inquiry activity and tell us when you would love to celebrate. Our team confirms actual venue availability after reviewing your inquiry.</p></div>
   <div className="query-layout">
    <div className="query-calendar-panel">
     <div className="query-calendar-top"><div><p className="query-mini">SELECT A PREFERRED DATE</p><h3>Event Inquiry Calendar</h3></div>
       <div className="query-month-controls"><button type="button" onClick={()=>move(-1)} aria-label="Previous month">‹</button><strong aria-live="polite">{monthName(year,month)}</strong><button type="button" onClick={()=>move(1)} aria-label="Next month">›</button></div></div>
     {status==='loading'&&<p role="status" className="query-loading">Loading inquiry activity…</p>}
     {error&&<p role="alert" className="query-inline-error">{error}</p>}
     <div className="query-weekdays">{weekdays.map(d=><span key={d}>{d}</span>)}</div>
     <div className="query-grid">{cells.map((cell,i)=>cell?
      <button type="button" key={cell.date} className={'query-day '+(selected===cell.date?'selected':'')} onClick={()=>choose(cell.date)} aria-label={`${cell.date}. ${status==='ready'&&counts.mode!=='HIDDEN'&&((counts.mode==='REAL')||lookup.has(cell.date))?`${lookup.get(cell.date)??0} displayed inquiries.`:''} Select event date`}>
       <span className="query-day-number">{cell.day}</span>{displayCount(cell.date)}
      </button>:<span key={'empty-'+i} className="query-empty" aria-hidden="true"/> )}</div>
     <p className="query-caption">{counts.mode==='MANUAL'&&status==='ready'?'Displayed figures may be configured by the venue and are not verified booking information.': 'Inquiry activity does not indicate confirmed bookings or actual availability.'}</p>
    </div>
    <aside className="query-side-panel" aria-label="Inquiry information">
     <h3>Make Your Moment Special</h3><div className="query-side-point"><Icon name="calendar" size={27}/><div><strong>Real-time display settings</strong><p>Inquiry activity is shown according to the venue's current calendar settings.</p></div></div>
     <div className="query-side-point"><Icon name="users" size={27}/><div><strong>Not a Reservation</strong><p>Selecting a date does not reserve or confirm the venue.</p></div></div>
     <div className="query-side-point"><Icon name="heart" size={27}/><div><strong>Choose Your Shift</strong><p>Pick Day or Night Shift and submit your event details.</p></div></div>
     <Link to="/inquiry" className="query-direct">Go directly to inquiry form <Icon name="arrow" size={17}/></Link>
    </aside>
   </div>
  </div>
  {selected&&<div className="shift-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
    <div ref={dialogRef} className="shift-dialog" role="dialog" aria-modal="true" aria-labelledby="shift-heading">
      <button className="shift-close" type="button" onClick={()=>setSelected(null)} aria-label="Close shift selection">×</button>
      <p className="section-kicker">YOUR EVENT INQUIRY</p><h3 id="shift-heading">Choose Your Preferred Shift</h3>
      <p>Preferred event date: <strong>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(selected+'T00:00:00Z'))}</strong></p>
      <div className="shift-options" role="group" aria-label="Preferred shift">
        <button type="button" aria-pressed={shift==='DAY'} onClick={()=>setShift('DAY')} className={shift==='DAY'?'chosen':''}><span aria-hidden="true">☀</span>Day Shift</button>
        <button type="button" aria-pressed={shift==='NIGHT'} onClick={()=>setShift('NIGHT')} className={shift==='NIGHT'?'chosen':''}><span aria-hidden="true">☾</span>Night Shift</button>
      </div>
      <button className="shift-continue" type="button" disabled={!shift} onClick={proceed}>Continue to Inquiry Form <Icon name="arrow" size={17}/></button>
      <p className="shift-note">Your inquiry is not a booking. Our team will confirm availability.</p>
    </div>
  </div>}
 </section>;
}
