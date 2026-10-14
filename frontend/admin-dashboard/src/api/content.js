import {api} from './client.js';
export function contentAdminApi(csrf){const safe={headers:{'x-csrf-token':csrf}};return {
 list:async entity=>(await api.get(`/admin/content/${entity}`)).data.items,
 create:async(entity,data)=>(await api.post(`/admin/content/${entity}`,data,safe)).data,
 update:async(entity,id,data)=>(await api.patch(`/admin/content/${entity}/${id}`,data,safe)).data,
 remove:async(entity,id)=>api.delete(`/admin/content/${entity}/${id}`,safe),
 getContact:async()=>(await api.get('/admin/content/contact')).data.contact,
 setContact:async(data)=>(await api.patch('/admin/content/contact',data,safe)).data.contact,
 upload:async(file,altText='')=>{const fd=new FormData();fd.append('image',file);fd.append('altText',altText);return (await api.post('/admin/gallery/media',fd,{...safe,timeout:45000})).data.media;},
};}
