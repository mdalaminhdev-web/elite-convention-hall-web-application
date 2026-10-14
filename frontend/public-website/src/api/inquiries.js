import { api } from './client.js';
export const inquiryApi={
 calendar:async month => (await api.get('/inquiries/calendar',{params:{month}})).data,
 submit:async data => (await api.post('/inquiries',data,{timeout:15000})).data,
};
