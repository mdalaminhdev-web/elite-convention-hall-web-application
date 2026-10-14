import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext.jsx';
import {inquiryAdminApi} from '../api/inquiries.js';
import '../inquiry-admin.css';
const pad=n=>String(n).padStart(2,'0');
const now=new Date();const initialMonth=`${now.getFullYear()}-${pad(now.getMonth()+1)}`;
export default function InquiryCalendarCMS(){
 const {admin,csrf}=useAuth();const remote=useMemo(()=>inquiryAdminApi(csrf),[csrf]);
 const [settings,setSettings]=useState(null);const [month,setMonth]=useState(initialMonth);const [entries,setEntries]=useState([]);
 const [day,setDay]=useState(`${initialMonth}-01`);const [count,setCount]=useState('0');
 const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 async function load(){const [s,e]=await Promise.all([remote.settings(),remote.manualCounts(month)]);setSettings(s);setEntries(e);}
 useEffect(()=>{let live=true;setLoading(true);setError('');Promise.all([remote.settings(),remote.manualCounts(month)])
  .then(([s,e])=>{if(live){setSettings(s);setEntries(e);}})
  .catch(()=>{if(live)setError('Could not load inquiry count settings.');})
  .finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[remote,month]);
 const changeMonth=e=>{const next=e.target.value;if(/^\d{4}-(0[1-9]|1[0-2])$/.test(next)){setMonth(next);setDay(next+'-01');}};
 async function setMode(mode){setBusy(true);setError('');setMessage('');try{await remote.setMode(mode);await load();setMessage('Calendar display mode updated.');}catch(e){setError(e.response?.data?.error?.message??'Could not update mode.');}finally{setBusy(false);}}
 async function save(e){e.preventDefault();const parsed=Number(count);if(!Number.isInteger(parsed)||parsed<0||parsed>4294967295){setError('Count must be a non-negative whole number.');return;}
  setBusy(true);setError('');setMessage('');try{await remote.saveCount(day,parsed);await load();setMessage(`Count saved for ${day}.`);}catch(e){setError(e.response?.data?.error?.message??'Could not save manual count.');}finally{setBusy(false);}}
 async function remove(date){if(!window.confirm(`Remove the manually entered count for ${date}?`))return;setBusy(true);setError('');setMessage('');try{await remote.deleteCount(date);await load();setMessage(`Manual count removed for ${date}.`);}catch(e){setError(e.response?.data?.error?.message??'Could not remove manual count.');}finally{setBusy(false);}}
 return <main className="icms-root"><header className="icms-top"><div><p>ELITE CONVENTION HALL • WEBSITE CMS</p><h1>Inquiry Count Management</h1><span>Signed in as {admin.fullName}</span></div><div className="icms-links"><Link to="/dashboard">Dashboard</Link><Link to="/inquiries">Received Inquiries</Link><Link to="/gallery">Gallery CMS</Link></div></header>
 <div className="icms-layout"><section className="icms-card"><h2>Public Calendar Display</h2><p className="icms-help">Choose one source only. Changing the displayed counts never changes real customer inquiries.</p>
 {loading?<p role="status">Loading…</p>:<div className="icms-modes" role="group" aria-label="Inquiry count display mode">{[
 {value:'REAL',heading:'Real Inquiry Show',body:'Counts genuine submitted inquiries automatically.'},
 {value:'MANUAL',heading:'Manual Inquiry Count',body:'Use the saved date-wise values instead of real counts.'},
 {value:'HIDDEN',heading:'Both OFF — Hide Counts',body:'Show calendar dates without displaying any counts.'},
 ].map(m=><button type="button" key={m.value} disabled={busy} aria-pressed={settings?.mode===m.value} className={settings?.mode===m.value?'active':''} onClick={()=>setMode(m.value)}><strong>{m.heading}</strong><span>{m.body}</span><small>{settings?.mode===m.value?'ACTIVE MODE':'Select mode'}</small></button>)}</div>}
 </section>
 <section className="icms-card"><h2>Date-wise Manual Count Entry</h2><p className="icms-help">An explicit zero displays “0” in Manual mode. A date with no saved record displays no number.</p>
 <form className="icms-entry" onSubmit={save}><label>Month<input type="month" value={month} onChange={changeMonth}/></label><label>Event Date<input type="date" value={day} required onChange={e=>setDay(e.target.value)}/></label><label>Manual Count<input type="number" min="0" max="4294967295" step="1" required value={count} onChange={e=>setCount(e.target.value)}/></label><button type="submit" disabled={busy||loading}>Save / Update</button></form>
 {error&&<p role="alert" className="icms-alert error">{error}</p>}{message&&<p role="status" className="icms-alert">{message}</p>}
 <h3 className="icms-table-title">Saved counts for {month}</h3>{entries.length===0?<p className="icms-help">No manually entered counts for this month.</p>:<div className="icms-overflow"><table><thead><tr><th>Date</th><th>Manual value</th><th>Actions</th></tr></thead><tbody>{entries.map(entry=><tr key={entry.date}><td>{entry.date}</td><td>{entry.count}</td><td><button type="button" onClick={()=>{setDay(entry.date);setCount(String(entry.count));}}>Edit</button><button type="button" disabled={busy} className="icms-remove" onClick={()=>remove(entry.date)}>Remove</button></td></tr>)}</tbody></table></div>}
 </section></div><p className="icms-footnote">The public calendar indicates inquiry activity and never confirms availability, booking or reservation status.</p>
 </main>;
}
