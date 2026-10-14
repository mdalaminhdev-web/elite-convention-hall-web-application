import {api} from './client.js';
export const inquiryAdminApi=csrf=>{
 const protectedConfig={headers:{'x-csrf-token':csrf}};
 return {
  summary:async()=> (await api.get('/admin/inquiries/summary')).data,
  dashboard:async()=> (await api.get('/admin/inquiries/dashboard')).data,
  list:async(params)=> (await api.get('/admin/inquiries',{params})).data,
  detail:async(id)=> (await api.get(`/admin/inquiries/${id}`)).data.inquiry,
  settings:async()=> (await api.get('/admin/calendar/settings')).data,
  setMode:async(mode)=> (await api.patch('/admin/calendar/settings',{mode},protectedConfig)).data,
  manualCounts:async(month)=> (await api.get('/admin/calendar/manual-counts',{params:{month}})).data.counts,
  saveCount:async(date,count)=> (await api.put(`/admin/calendar/manual-counts/${date}`,{count},protectedConfig)).data,
  deleteCount:async(date)=> api.delete(`/admin/calendar/manual-counts/${date}`,protectedConfig),
 };
};
