import {api} from './client.js';
export function siteAdminApi(csrf){const secure={headers:{'x-csrf-token':csrf}};return {
 get:async name=>(await api.get(`/admin/site/${name}`)).data.data,
 save:async(name,data)=>(await api.patch(`/admin/site/${name}`,data,secure)).data.data,
 list:async entity=>(await api.get(`/admin/site/${entity}`)).data.items,
 create:async(entity,data)=>(await api.post(`/admin/site/${entity}`,data,secure)).data,
 update:async(entity,id,data)=>(await api.patch(`/admin/site/${entity}/${id}`,data,secure)).data,
 remove:async(entity,id)=>api.delete(`/admin/site/${entity}/${id}`,secure),
 upload:async(file,altText='')=>{const form=new FormData();form.append('image',file);form.append('altText',altText);return (await api.post('/admin/gallery/media',form,{...secure,timeout:45000})).data.media;},
};}
