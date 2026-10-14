import React,{useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import Header from '../components/Header.jsx';import Footer from '../components/Footer.jsx';
import {Icon} from '../components/Icon.jsx';import {inquiryApi} from '../api/inquiries.js';
const dateIsValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())&&new Date(`${s}T00:00:00Z`).toISOString().slice(0,10)===s;
const newKey=()=>crypto.randomUUID();
export default function EventInquiry(){
 const [params]=useSearchParams();
 const initialDate=params.get('date')??'';
 const initialShift=params.get('shift')??'';
 const [fields,setFields]=useState({fullName:'',phoneNumber:'',email:'',eventDate:dateIsValid(initialDate)?initialDate:'',preferredShift:['DAY','NIGHT'].includes(initialShift)?initialShift:'',eventType:'',guestCount:'',companyOrganization:'',additionalDetails:''});
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [receipt,setReceipt]=useState(null);
 const submissionKey=useRef(newKey());
 const update=(name,value)=>setFields(prev=>({...prev,[name]:value}));
 async function submit(event){
  event.preventDefault();if(busy)return;setBusy(true);setError('');
  if(!dateIsValid(fields.eventDate)||!['DAY','NIGHT'].includes(fields.preferredShift)){
    setError('Select a valid event date and a preferred shift.');setBusy(false);return;
  }
  try {
   const data=await inquiryApi.submit({
    submissionKey:submissionKey.current,fullName:fields.fullName.trim(),phoneNumber:fields.phoneNumber.trim(),email:fields.email.trim(),
    eventDate:fields.eventDate,preferredShift:fields.preferredShift,eventType:fields.eventType.trim(),
    guestCount:fields.guestCount===''?null:Number(fields.guestCount),companyOrganization:fields.companyOrganization.trim(),additionalDetails:fields.additionalDetails.trim(),
   });
   setReceipt(data);
  }catch(e){setError(e.response?.data?.error?.message || 'We could not submit your inquiry. Please check your connection and try again.');}
  finally{setBusy(false);}
 }
 return <><Header/><main className="inquiry-page">
  <div className="inquiry-banner"><div className="container-wide"><p className="section-kicker">EVENT INQUIRY</p><h1>Complete Your <em>Inquiry</em></h1><p>Tell us about your event. Our team will review your inquiry and contact you to confirm actual availability.</p></div></div>
  <div className="container-wide inquiry-card-wrap">{receipt?<div className="inquiry-receipt" role="status">
    <div className="inquiry-receipt-icon">✓</div><h2>Inquiry Received Successfully</h2><p>Thank you. Your inquiry has been received. Our team will review your request and confirm venue availability with you.</p><p>Reference: <strong>{receipt.reference}</strong></p><Link to="/" className="btn-gold">Return to Homepage <Icon name="arrow" size={18}/></Link>
   </div>:<form className="inquiry-form" onSubmit={submit}>
    <div className="inquiry-selection"><div><Icon name="calendar"/><span><small>Preferred Event Date</small><strong>{fields.eventDate||'Please select a date'}</strong></span></div><div><Icon name="spark"/><span><small>Preferred Shift</small><strong>{fields.preferredShift?fields.preferredShift==='DAY'?'Day Shift':'Night Shift':'Please select shift'}</strong></span></div></div>
    <div className="inquiry-fields">
      <label>Full Name <span aria-hidden="true">*</span><input name="fullName" autoComplete="name" required minLength={2} maxLength={150} value={fields.fullName} onChange={e=>update('fullName',e.target.value)} placeholder="Enter your full name"/></label>
      <label>Phone Number <span aria-hidden="true">*</span><input name="phoneNumber" autoComplete="tel" type="tel" required minLength={7} maxLength={32} value={fields.phoneNumber} onChange={e=>update('phoneNumber',e.target.value)} placeholder="Enter your contact number"/></label>
      <label>Email (optional)<input name="email" type="email" autoComplete="email" maxLength={254} value={fields.email} onChange={e=>update('email',e.target.value)} placeholder="Enter your email address"/></label>
      <label>Event Type (optional)<input name="eventType" maxLength={120} value={fields.eventType} onChange={e=>update('eventType',e.target.value)} placeholder="E.g. wedding, corporate event"/></label>
      <label>Number of Guests (optional)<input name="guestCount" type="number" min={1} max={100000} step={1} value={fields.guestCount} onChange={e=>update('guestCount',e.target.value)} placeholder="Approximate guest count"/></label>
      <label>Company / Organization (optional)<input name="companyOrganization" maxLength={200} value={fields.companyOrganization} onChange={e=>update('companyOrganization',e.target.value)} placeholder="If applicable"/></label>
      <label>Preferred Event Date <span aria-hidden="true">*</span><input name="eventDate" type="date" required value={fields.eventDate} onChange={e=>update('eventDate',e.target.value)}/></label>
      <label>Preferred Shift <span aria-hidden="true">*</span><select required name="preferredShift" value={fields.preferredShift} onChange={e=>update('preferredShift',e.target.value)}><option value="">Select your shift</option><option value="DAY">Day Shift</option><option value="NIGHT">Night Shift</option></select></label>
      <label className="inquiry-full">Additional Details (optional)<textarea rows={5} name="additionalDetails" maxLength={5000} value={fields.additionalDetails} onChange={e=>update('additionalDetails',e.target.value)} placeholder="Tell us about your event plans, preferences or questions"/></label>
    </div>
    <p className="inquiry-disclaimer"><Icon name="heart" size={18}/> Submitting an inquiry does not create a reservation. The Elite Convention Hall team will confirm availability separately.</p>
    {error&&<p role="alert" className="inquiry-error">{error}</p>}
    <button type="submit" disabled={busy} className="inquiry-submit">{busy?'Submitting…':'Submit Inquiry'} <Icon name="arrow" size={17}/></button>
    <Link className="inquiry-back" to="/#query-calendar">← Return to Query Calendar</Link>
  </form>}
  </div>
 </main><Footer/></>;
}
