import {useCallback,useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext.jsx';
import {inquiryAdminApi} from '../api/inquiries.js';
import '../dashboard.css';

const modeText={REAL:'Real inquiry counts',MANUAL:'Manual display counts',HIDDEN:'Counts hidden'};
function displayDate(date){
  if(!date)return '—';
  const [year,month,day]=date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric'}).format(new Date(Date.UTC(year,month-1,day)));
}
function timestamp(value){return value?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'}).format(new Date(value)):'—';}
function Metric({title,value,icon,note}){return <article className="ech-stat-card"><div className="ech-stat-top"><span>{title}</span><span aria-hidden="true" className="ech-stat-symbol">{icon}</span></div><div className="ech-stat-value">{value}</div><div className="ech-stat-note">{note}</div></article>;}
export default function Dashboard(){
  const {admin,csrf}=useAuth();const api=useMemo(()=>inquiryAdminApi(csrf),[csrf]);
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);setError('');try{setData(await api.dashboard());}catch(e){setError(e?.response?.data?.error?.message||'Could not load dashboard data. Check the API and MySQL connection.');}finally{setLoading(false);}
  },[api]);
  useEffect(()=>{let active=true;api.dashboard().then(v=>{if(active)setData(v);}).catch(()=>{if(active)setError('Could not load dashboard data. Check the API and MySQL connection.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[api]);
  const daily=data?.dailyActivity??[];
  const max=Math.max(1,...daily.map(d=>d.count));
  return <main className="ech-dashboard">
    <div className="ech-page-intro"><div><p className="ech-kicker">ADMIN OVERVIEW</p><h1>Dashboard</h1><p>Welcome back, {admin?.fullName}. Review genuine website inquiries and manage published content.</p></div><button type="button" onClick={load} disabled={loading} className="ech-btn-secondary">{loading?'Refreshing…':'↻ Refresh data'}</button></div>
    {error&&<div role="alert" className="ech-dashboard-error">{error} <button type="button" onClick={load}>Retry</button></div>}
    {loading&&!data?<p role="status" className="ech-loading">Loading live website metrics…</p>:data&&<>
      <div className="ech-stat-grid">
        <Metric title="Total inquiries" value={data.metrics.totalInquiries.toLocaleString()} icon="✉" note="Actual submitted records"/>
        <Metric title="Received today" value={data.metrics.submittedToday.toLocaleString()} icon="◷" note="Today in Bangladesh"/>
        <Metric title="This month" value={data.metrics.submittedThisMonth.toLocaleString()} icon="▤" note="Month of submission, not event"/>
        <Metric title="Published albums" value={data.metrics.publishedAlbums.toLocaleString()} icon="▧" note="Visible in public gallery"/>
      </div>
      <div className="ech-dashboard-grid">
        <section className="ech-dashboard-panel ech-chart-panel"><div className="ech-panel-heading"><div><h2>Inquiry activity</h2><p>Actual inquiries received over the last 7 calendar days</p></div><span className="ech-panel-tag">Asia/Dhaka</span></div>
          <div className="ech-bar-chart" role="img" aria-label={'Actual inquiries received in last seven days: '+daily.map(x=>`${x.date}, ${x.count}`).join('; ')}>
            {daily.map(row=><div key={row.date} className="ech-chart-column"><span className="ech-chart-count">{row.count}</span><div className="ech-chart-track"><div className="ech-chart-fill" style={{height:row.count?Math.max(7,row.count/max*100)+'%':'0%'}}/></div><span className="ech-chart-day">{new Intl.DateTimeFormat('en-GB',{weekday:'short',timeZone:'UTC'}).format(new Date(row.date+'T12:00:00Z'))}</span></div>)}
          </div>
          <p className="ech-chart-footnote">Submission counts only. These figures do not indicate confirmed bookings.</p>
        </section>
        <section className="ech-dashboard-panel ech-count-panel"><div className="ech-panel-heading"><div><h2>Calendar display</h2><p>Public Query Calendar settings</p></div><span className="ech-panel-tag">Live configuration</span></div>
          <div className="ech-count-indicator"><span className={'ech-mode-dot '+data.calendarMode.toLowerCase()}/><span>{modeText[data.calendarMode]??'Not configured'}</span></div>
          <p>Only inquiry activity is displayed; the calendar never confirms availability or reserves a venue date.</p>
          {data.calendarMode==='MANUAL'&&<p>Missing manual entries show no count. An explicitly saved zero displays 0.</p>}
          <Link className="ech-primary-link" to="/calendar">Manage count settings <span aria-hidden="true">→</span></Link>
          <div className="ech-count-secondary"><span>Event dates with real inquiries</span><strong>{data.metrics.datesWithInquiries}</strong></div>
        </section>
      </div>
      <section className="ech-dashboard-panel ech-recent-panel"><div className="ech-panel-heading"><div><h2>Recent inquiries</h2><p>Latest genuine submissions received through the public form</p></div><Link className="ech-panel-link" to="/inquiries">View all inquiries →</Link></div>
        {data.recentInquiries.length===0?<div className="ech-empty"><strong>No inquiries received yet</strong><p>Submitted website inquiries will appear here automatically.</p></div>:<div className="ech-table-scroll"><table className="ech-table"><thead><tr><th>Customer</th><th>Phone</th><th>Preferred event date</th><th>Shift</th><th>Received (BD time)</th><th>Action</th></tr></thead><tbody>{data.recentInquiries.map(i=><tr key={i.id}><td><strong>{i.fullName}</strong><small>{i.eventType||'Event type not provided'}</small></td><td>{i.phoneNumber}</td><td>{displayDate(i.eventDate)}</td><td><span className="ech-shift-chip">{i.preferredShift==='DAY'?'Day':'Night'}</span></td><td>{timestamp(i.submittedAt)}</td><td><Link to={`/inquiries?open=${i.id}`} className="ech-row-action">View details →</Link></td></tr>)}</tbody></table></div>}
      </section>
      <section className="ech-shortcuts" aria-label="Quick management links"><h2>Content management</h2><div><Link to="/gallery">Gallery & albums ↗</Link><Link to="/content?tab=facilities">Facilities ↗</Link><Link to="/content?tab=vendors">Vendors ↗</Link><Link to="/content?tab=reviews">Client reviews ↗</Link><Link to="/content?tab=faqs">FAQ ↗</Link><Link to="/content?tab=contact">Contact details ↗</Link></div></section>
    </>}
  </main>;
}
