import {useState} from 'react';
import {Link, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext.jsx';
import '../admin-shell.css';

const menu = [
  {group:'OVERVIEW', items:[['Dashboard','/dashboard','▦'],['Received Inquiries','/inquiries','✉'],['Inquiry Count Settings','/calendar','▤']]},
  {group:'WEBSITE CONTENT',items:[['Hero Section','/site?tab=hero','✦'],['About Us','/site?tab=about','◇'],['Footer & Branding','/site?tab=footer','▤'],['Gallery Albums','/gallery','▧'],['Facilities','/content?tab=facilities','◇'],['Vendors','/content?tab=vendors','✧'],['Client Reviews','/content?tab=reviews','★'],['FAQs','/content?tab=faqs','?'],['Contact Details','/content?tab=contact','☎']]},
];
export default function AdminShell(){
  const {admin,logout}=useAuth();
  const [menuOpen,setMenuOpen]=useState(false);
  const [signingOut,setSigningOut]=useState(false);
  const [logoutError,setLogoutError]=useState('');
  const location=useLocation();
  async function signOut(){
    setLogoutError('');setSigningOut(true);
    try{await logout();}catch{setLogoutError('Sign-out failed. Try again.');}
    finally{setSigningOut(false);}
  }
  const select=()=>setMenuOpen(false);
  return <div className="ech-workspace">
    {menuOpen&&<button className="ech-scrim" type="button" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}/>}
    <aside className={'ech-sidebar'+(menuOpen?' open':'')} aria-label="Admin navigation">
      <Link onClick={select} className="ech-sidebar-brand" to="/dashboard">
        <span className="ech-brand-monogram" aria-hidden="true">E</span>
        <span><strong>ELITE</strong><small>CONVENTION HALL</small><em>WEBSITE CMS</em></span>
      </Link>
      <nav aria-label="CMS modules">
      {menu.map(group=><div className="ech-nav-group" key={group.group}>
        <p>{group.group}</p>
        {group.items.map(([label,to,symbol])=>{
          const [path,query]=to.split('?');
          const tab=new URLSearchParams(query||'').get('tab');
          const currentTab=new URLSearchParams(location.search).get('tab')||(path==='/site'?'hero':'facilities');
          const selected=location.pathname===path&&(!tab||tab===currentTab);
          return <Link key={to} to={to} onClick={select} aria-current={selected?'page':undefined} className={'ech-nav-link'+(selected?' selected':'')}>
            <span className="ech-nav-symbol" aria-hidden="true">{symbol}</span><span>{label}</span>
          </Link>;
        })}
      </div>)}
      </nav>
      <div className="ech-sidebar-bottom"><span aria-hidden="true">●</span> Website administration <small>Inquiries are not reservations</small></div>
    </aside>
    <div className="ech-content-area">
      <header className="ech-workspace-header">
        <button className="ech-mobile-toggle" type="button" onClick={()=>setMenuOpen(v=>!v)} aria-label="Open navigation" aria-expanded={menuOpen}>☰</button>
        <div className="ech-header-site"><span className="ech-header-eyebrow">ELITE CONVENTION HALL</span><strong>Website Administration</strong></div>
        <div className="ech-header-right">
          <a className="ech-visit-site" href={import.meta.env.DEV?'http://127.0.0.1:5173/':'/'} target="_blank" rel="noreferrer" title="Local development website">Visit site ↗</a>
          <span className="ech-admin-identity" title={admin?.email}><span className="ech-avatar">{(admin?.fullName||'A').slice(0,1).toUpperCase()}</span><span><strong>{admin?.fullName||'Administrator'}</strong><small>Website Admin</small></span></span>
          <button className="ech-logout" type="button" onClick={signOut} disabled={signingOut}>{signingOut?'Signing out…':'Sign out'}</button>
        </div>
      </header>
      {logoutError&&<p className="ech-logout-error" role="alert">{logoutError}</p>}
      <div className="ech-route-content"><Outlet/></div>
    </div>
  </div>;
}
