import { api } from './client.js';
export function galleryAdminApi(csrf){
 const safe = { headers: {'x-csrf-token':csrf} };
 return {
  list: async()=> (await api.get('/admin/gallery/albums')).data.albums,
  get: async id =>(await api.get(`/admin/gallery/albums/${id}`)).data,
  create: async payload=>(await api.post('/admin/gallery/albums',payload,safe)).data,
  update: async (id,payload)=>(await api.patch(`/admin/gallery/albums/${id}`,payload,safe)).data,
  remove: async id=>api.delete(`/admin/gallery/albums/${id}`,safe),
  upload:async(file,altText='')=> {const data=new FormData();data.append('image',file);data.append('altText',altText);return (await api.post('/admin/gallery/media',data,{...safe,timeout:45000})).data.media;},
  addPhoto:async(id,payload)=>(await api.post(`/admin/gallery/albums/${id}/photos`,payload,safe)).data,
  editPhoto:async(id,photoId,payload)=>(await api.patch(`/admin/gallery/albums/${id}/photos/${photoId}`,payload,safe)).data,
  deletePhoto:async(id,photoId)=>api.delete(`/admin/gallery/albums/${id}/photos/${photoId}`,safe),
  reorder:async(id,photoIds)=>(await api.put(`/admin/gallery/albums/${id}/photos/order`,{photoIds},safe)).data,
 };
}
