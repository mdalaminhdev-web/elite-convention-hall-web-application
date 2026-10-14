import {useEffect,useMemo,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext.jsx';
import {inquiryAdminApi} from '../api/inquiries.js';
import '../inquiry-admin.css';
import '../inquiry-inbox.css';

const formatEventDate = value => {
  if(!value)return '—';
  const [year,month,day]=value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day)));
};
const formatSubmitted = value => value?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'}).format(new Date(value)):'—';
function Value({label,children}){return <div className="ii-detail-field"><dt>{label}</dt><dd>{children==null||children===''?'Not provided':children}</dd></div>;}

function DetailModal({inquiry,onClose}){
  const closeRef=useRef(null),dialogRef=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;
    closeRef.current?.focus();
    function keydown(e){
      if(e.key==='Escape'){e.preventDefault();onClose();}
      if(e.key==='Tab'){
        const focusable=[...dialogRef.current.querySelectorAll('button,a[href],input,select,textarea')].filter(x=>!x.disabled);
        if(!focusable.length)return;
        if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}
        else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}
      }
    }
    document.addEventListener('keydown',keydown);
    return ()=>{document.removeEventListener('keydown',keydown);previous?.focus?.();};
  },[onClose]);
  const cleanPhone=(inquiry.phoneNumber||'').replace(/[^+\d]/g,'');
  return <div className="ii-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section className="ii-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ii-modal-title">
      <div className="ii-modal-header"><div><p className="ii-kicker">SUBMITTED WEBSITE INQUIRY</p><h2 id="ii-modal-title">Inquiry #{inquiry.id}</h2><span>Received {formatSubmitted(inquiry.submittedAt)} · Bangladesh time</span></div><button type="button" ref={closeRef} className="ii-close" onClick={onClose} aria-label="Close inquiry details">×</button></div>
      <div className="ii-not-booking">This is an inquiry, not a confirmed venue booking. The hall team must confirm actual availability.</div>
      <section className="ii-detail-section"><h3>Selected event details</h3><dl><Value label="Preferred date">{formatEventDate(inquiry.eventDate)}</Value><Value label="Preferred shift">{inquiry.preferredShift==='DAY'?'Day Shift':'Night Shift'}</Value></dl></section>
      <section className="ii-detail-section"><h3>Client details</h3><dl><Value label="Full name">{inquiry.fullName}</Value><Value label="Phone number">{inquiry.phoneNumber}</Value><Value label="Email">{inquiry.email}</Value></dl></section>
      <section className="ii-detail-section"><h3>Event information</h3><dl><Value label="Event type">{inquiry.eventType}</Value><Value label="Number of guests">{inquiry.guestCount}</Value><Value label="Company / organization">{inquiry.companyOrganization}</Value></dl><div className="ii-additional"><strong>Additional details</strong><p>{inquiry.additionalDetails||'Not provided'}</p></div></section>
      <div className="ii-modal-actions">{cleanPhone&&<a href={'tel:'+cleanPhone}>Call client ↗</a>}{inquiry.email&&<a href={'mailto:'+inquiry.email}>Email client ↗</a>}<button type="button" onClick={onClose}>Close details</button></div>
    </section>
  </div>;
}
export default function InquiryInbox(){
  const {csrf}=useAuth();const api=useMemo(()=>inquiryAdminApi(csrf),[csrf]);
  const [searchParams,setSearchParams]=useSearchParams();
  const [form,setForm]=useState({search:'',eventDate:'',shift:''});
  const [criteria,setCriteria]=useState({search:'',eventDate:'',shift:''});
  const [page,setPage]=useState(1);
  const [results,setResults]=useState({items:[],total:0,page:1,totalPages:0});
  const [detail,setDetail]=useState(null),[detailBusy,setDetailBusy]=useState(false);
  const [loading,setLoading]=useState(true),[error,setError]=useState('');
  const openId=searchParams.get('open');
  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');
    api.list({page,pageSize:15,...criteria}).then(d=>{if(active)setResults(d);}).catch(()=>{if(active)setError('Could not load inquiries. Please retry.');}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[api,page,criteria]);
  useEffect(()=>{
    if(!openId){setDetail(null);return;}
    if(!/^[1-9]\d{0,18}$/.test(openId)){setError('Invalid inquiry reference.');return;}
    let active=true;setDetailBusy(true);
    api.detail(openId).then(v=>{if(active){setDetail(v);setError('');}}).catch(()=>{if(active){setError('Could not open inquiry details.');setDetail(null);}}).finally(()=>{if(active)setDetailBusy(false);});
    return()=>{active=false;};
  },[api,openId]);
  function closeDetail(){setDetail(null);const next=new URLSearchParams(searchParams);next.delete('open');setSearchParams(next,{replace:true});}
  function openDetail(id){setSearchParams({...Object.fromEntries(searchParams),open:id});}
  function submit(e){e.preventDefault();setPage(1);setCriteria({...form});}
  function reset(){const empty={search:'',eventDate:'',shift:''};setForm(empty);setCriteria(empty);setPage(1);}
  return <main className="ii-root">
    <header className="ii-heading"><div><p className="ii-kicker">CUSTOMER INQUIRIES</p><h1>Inquiry Management</h1><p>Read and follow up on genuine website inquiries. No inquiry is a confirmed reservation.</p></div><Link className="ii-outline-link" to="/calendar">Inquiry count settings →</Link></header>
    <section className="ii-panel"><div className="ii-panel-top"><div><h2>Received inquiries</h2><p>Search by customer and filter by requested event date or shift.</p></div><span className="ii-total">{results.total.toLocaleString()} matching inquiries</span></div>
      <form className="ii-filters" onSubmit={submit}><label className="ii-wide">Search name, phone, email<input value={form.search} maxLength={100} onChange={e=>setForm(v=>({...v,search:e.target.value}))} placeholder="Search customer or contact"/></label><label>Preferred event date<input type="date" value={form.eventDate} onChange={e=>setForm(v=>({...v,eventDate:e.target.value}))}/></label><label>Preferred shift<select value={form.shift} onChange={e=>setForm(v=>({...v,shift:e.target.value}))}><option value="">All shifts</option><option value="DAY">Day Shift</option><option value="NIGHT">Night Shift</option></select></label><button type="submit" className="ii-filter-submit" disabled={loading}>Apply filters</button><button type="button" className="ii-filter-clear" onClick={reset}>Clear</button></form>
      {error&&<div className="ii-error" role="alert">{error}</div>}
      {loading?<div className="ii-empty" role="status">Loading inquiries…</div>:results.items.length===0?<div className="ii-empty"><strong>No matching inquiries</strong><p>Change your filters or wait for customers to submit inquiries.</p></div>:<div className="ii-table-scroll"><table className="ii-table"><thead><tr><th>Customer</th><th>Contact</th><th>Preferred event</th><th>Shift</th><th>Type / guests</th><th>Received (BD)</th><th></th></tr></thead><tbody>{results.items.map(item=><tr key={item.id}><td><strong>{item.fullName}</strong><small>Inquiry #{item.id}</small></td><td><span>{item.phoneNumber}</span><small>{item.email||'No email'}</small></td><td>{formatEventDate(item.eventDate)}</td><td><span className="ii-shift">{item.preferredShift==='DAY'?'Day':'Night'}</span></td><td><span>{item.eventType||'Not provided'}</span><small>{item.guestCount==null?'Guest count not provided':item.guestCount+' guests'}</small></td><td>{formatSubmitted(item.submittedAt)}</td><td><button type="button" className="ii-view" onClick={()=>openDetail(item.id)}>View →</button></td></tr>)}</tbody></table></div>}
      <div className="ii-pagination"><p>Page {results.page} of {Math.max(1,results.totalPages)} · {results.total} matching inquiries</p><div><button type="button" disabled={page<=1||loading} onClick={()=>setPage(v=>Math.max(1,v-1))}>← Previous</button><button type="button" disabled={page>=results.totalPages||loading} onClick={()=>setPage(v=>v+1)}>Next →</button></div></div>
    </section>
    {detailBusy&&<div className="ii-loading-detail" role="status">Loading inquiry details…</div>}
    {detail&&<DetailModal inquiry={detail} onClose={closeDetail}/>}
  </main>;
}
