import {useCallback,useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext.jsx';
import {galleryAdminApi} from '../api/gallery.js';

const emptyAlbum={title:'',slug:'',description:'',featured:false,published:false,sortOrder:0,coverMediaId:null};
const slugify=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,200);
function messageOf(e){return e?.response?.data?.error?.message||e?.message||'Request failed. Please retry.';}
function PhotoCard({photo,albumId,api,onRefresh,notify}){
 const [form,setForm]=useState({caption:photo.caption,altText:photo.altText,published:photo.published});
 const [busy,setBusy]=useState(false);
 useEffect(()=>setForm({caption:photo.caption,altText:photo.altText,published:photo.published}),[photo.id,photo.caption,photo.altText,photo.published]);
 async function edit(payload){setBusy(true);try{await api.editPhoto(albumId,photo.id,payload);await onRefresh();notify('Photo updated.');}catch(e){notify(messageOf(e),true);}finally{setBusy(false);}}
 async function replace(e){const file=e.target.files?.[0];if(!file)return;setBusy(true);try{const media=await api.upload(file,form.altText);await api.editPhoto(albumId,photo.id,{mediaId:media.id});await onRefresh();notify('Image replaced.');}catch(ex){notify(messageOf(ex),true);}finally{setBusy(false);e.target.value='';}}
 async function remove(){if(!window.confirm('Remove this photograph from the album?'))return;setBusy(true);try{await api.deletePhoto(albumId,photo.id);await onRefresh();notify('Photo removed from album.');}catch(e){notify(messageOf(e),true);}finally{setBusy(false);}}
 return <article className="cms-photo-card"><img src={photo.url} alt={photo.altText||photo.caption||'Album photograph'} loading="lazy"/><div className="cms-photo-fields">
  <label>Caption<input value={form.caption} maxLength="500" onChange={e=>setForm(s=>({...s,caption:e.target.value}))}/></label>
  <label>Alternative text<input value={form.altText} maxLength="500" onChange={e=>setForm(s=>({...s,altText:e.target.value}))}/></label>
  <label className="cms-check"><input type="checkbox" checked={form.published} onChange={e=>setForm(s=>({...s,published:e.target.checked}))}/> Published</label>
  <div className="cms-actions"><button disabled={busy} onClick={()=>edit(form)}>Save details</button><button disabled={busy} onClick={remove}>Remove</button></div>
  <label className="cms-upload-label">Replace photograph<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={replace}/></label>
 </div></article>;
}
export default function GalleryCMS(){
 const {csrf}=useAuth();const api=useMemo(()=>galleryAdminApi(csrf),[csrf]);
 const [albums,setAlbums]=useState([]);const [selectedId,setSelectedId]=useState(null);const [current,setCurrent]=useState(null);
 const [albumForm,setAlbumForm]=useState(emptyAlbum);const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState('');const [failure,setFailure]=useState(false);
 const notify=(message,error=false)=>{setNotice(message);setFailure(error);};
 const refreshList=useCallback(async()=>setAlbums(await api.list()),[api]);
 const refreshCurrent=useCallback(async()=>{if(selectedId){const details=await api.get(selectedId);setCurrent(details);setAlbumForm({...details.album});}},[api,selectedId]);
 useEffect(()=>{let active=true;api.list().then(a=>{if(active)setAlbums(a);}).catch(e=>{if(active)notify(messageOf(e),true);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[api]);
 useEffect(()=>{let active=true;if(!selectedId){setCurrent(null);setAlbumForm({...emptyAlbum});return;}api.get(selectedId).then(details=>{if(active){setCurrent(details);setAlbumForm({...details.album});}}).catch(e=>{if(active)notify(messageOf(e),true);});return()=>{active=false;};},[api,selectedId]);
 const field=(k,v)=>setAlbumForm(s=>({...s,[k]:v}));
 async function saveAlbum(e){e.preventDefault();notify('');setBusy(true);try{
  const {title,description,slug,featured,published,sortOrder,coverMediaId}=albumForm;
  const payload={title:title.trim(),description,slug:slug.trim(),featured:!!featured,published:!!published,sortOrder:Number(sortOrder),coverMediaId};
  const result=selectedId?await api.update(selectedId,payload):await api.create(payload);
  await refreshList();setSelectedId(result.album.id);setCurrent(result);setAlbumForm({...result.album});notify('Album saved successfully.');
 }catch(e){notify(messageOf(e),true);}finally{setBusy(false);}}
 async function uploadCover(e){const file=e.target.files?.[0];if(!file)return;setBusy(true);try{
  const media=await api.upload(file,albumForm.title);
  if(selectedId){const details=await api.update(selectedId,{coverMediaId:media.id});setCurrent(details);setAlbumForm({...details.album});await refreshList();}
  else{setAlbumForm(s=>({...s,coverMediaId:media.id}));}
  notify(selectedId?'Cover image saved.':'Cover image uploaded. Save the album to apply it.');
 }catch(e){notify(messageOf(e),true);}finally{setBusy(false);e.target.value='';}}
 async function uploadPhotos(e){const files=Array.from(e.target.files||[]);if(!selectedId||!files.length)return;setBusy(true);let complete=0;try{
  for(const file of files){const media=await api.upload(file,'');await api.addPhoto(selectedId,{mediaId:media.id,caption:'',altText:'',published:true});complete++;}
  await refreshCurrent();await refreshList();notify(`${complete} photograph(s) uploaded.`);
 }catch(e){await refreshCurrent();await refreshList();notify(`${complete} uploaded; ${messageOf(e)}`,true);}finally{setBusy(false);e.target.value='';}}
 async function deleteAlbum(){if(!selectedId||!window.confirm('Delete this album and unlink all its photographs? Uploaded image files remain until media cleanup.'))return;
  setBusy(true);try{await api.remove(selectedId);setSelectedId(null);setCurrent(null);setAlbumForm({...emptyAlbum});await refreshList();notify('Album deleted.');}catch(e){notify(messageOf(e),true);}finally{setBusy(false);}}
 async function movePhoto(i,delta){const photos=current?.photos??[];const next=i+delta;if(next<0||next>=photos.length)return;setBusy(true);try{
  const ids=photos.map(p=>p.id);[ids[i],ids[next]]=[ids[next],ids[i]];const details=await api.reorder(selectedId,ids);setCurrent(details);notify('Photo order saved.');
 }catch(e){notify(messageOf(e),true);}finally{setBusy(false);}}
 async function coverFromPhoto(photo){setBusy(true);try{const details=await api.update(selectedId,{coverMediaId:photo.mediaId});setCurrent(details);setAlbumForm({...details.album});await refreshList();notify('Album cover updated.');}catch(e){notify(messageOf(e),true);}finally{setBusy(false);}}
 return <main className="cms-root"><header className="cms-header"><div><p>ELITE CONVENTION HALL / ADMIN</p><h1>Gallery Management</h1><span>Create albums, upload and arrange images, and control publishing.</span></div><Link to="/dashboard">← Dashboard</Link></header>
 <div className="cms-shell"><aside className="cms-list"><div className="cms-list-title"><h2>Albums</h2><button onClick={()=>{setSelectedId(null);setCurrent(null);setAlbumForm({...emptyAlbum});notify('');}}>+ New</button></div>
 {loading?<p>Loading albums…</p>:albums.length===0?<p>No albums created yet.</p>:albums.map(a=><button key={a.id} onClick={()=>{setSelectedId(a.id);notify('');}} className={'cms-album-option '+(selectedId===a.id?'selected':'')}>
 <strong>{a.title}</strong><span>{a.published?'Published':'Draft'} · {a.photoCount} public photos</span></button>)}
 </aside><section className="cms-editor"><div className="cms-editor-top"><h2>{selectedId?'Edit Album':'Create Album'}</h2>{selectedId&&<button className="cms-danger" onClick={deleteAlbum} disabled={busy}>Delete album</button>}</div>
 {notice&&<p role={failure?'alert':'status'} className={'cms-notice '+(failure?'cms-error':'')}>{notice}</p>}
 <form className="cms-album-form" onSubmit={saveAlbum}>
 <label>Album title<input required maxLength="255" value={albumForm.title} onChange={e=>{const value=e.target.value;setAlbumForm(s=>({...s,title:value,slug:(!selectedId||s.slug===slugify(s.title))?slugify(value):s.slug}));}}/></label>
 <label>URL slug<input required maxLength="200" pattern="[a-z0-9]+(-[a-z0-9]+)*" value={albumForm.slug} onChange={e=>field('slug',e.target.value.toLowerCase())}/></label>
 <label className="cms-wide">Description<textarea rows="3" maxLength="10000" value={albumForm.description} onChange={e=>field('description',e.target.value)}/></label>
 <label>Display order<input type="number" min="0" max="1000000" value={albumForm.sortOrder} onChange={e=>field('sortOrder',Number(e.target.value))}/></label>
 <label className="cms-check"><input type="checkbox" checked={albumForm.featured} onChange={e=>field('featured',e.target.checked)}/> Featured on homepage</label>
 <label className="cms-check"><input type="checkbox" checked={albumForm.published} onChange={e=>field('published',e.target.checked)}/> Publish album</label>
 <div className="cms-cover cms-wide"><div>{albumForm.coverUrl?<img src={albumForm.coverUrl} alt="Current album cover"/>:<span>{albumForm.coverMediaId?'New cover uploaded':'No cover selected'}</span>}</div><label className="cms-upload-label">Upload / Change Cover<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCover} disabled={busy}/></label></div>
 <div className="cms-wide cms-actions"><button disabled={busy} type="submit">{busy?'Saving…':selectedId?'Save Album Changes':'Create Album'}</button></div>
 </form>
 {selectedId&&current&&<section className="cms-photos"><div className="cms-editor-top"><div><h2>Album Photographs</h2><p>{current.photos.length} total photographs (published and draft)</p></div><label className="cms-upload-label">+ Add Photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhotos}/></label></div>
 {current.photos.length===0?<p>Upload photographs to build this album.</p>:<div className="cms-photo-grid">{current.photos.map((photo,i)=><div key={photo.id}><div className="cms-photo-order"><button disabled={busy||i===0} onClick={()=>movePhoto(i,-1)}>↑ Earlier</button><span>#{i+1}</span><button disabled={busy||i===current.photos.length-1} onClick={()=>movePhoto(i,1)}>↓ Later</button></div>
 <PhotoCard photo={photo} albumId={selectedId} api={api} onRefresh={async()=>{await refreshCurrent();await refreshList();}} notify={notify}/><button className="cms-set-cover" disabled={busy} onClick={()=>coverFromPhoto(photo)}>Set as album cover</button></div>)}</div>}
 <p className="cms-help">Images remain stored when a photo or album is deleted. Orphaned media can be safely cleaned up in a future media-maintenance phase.</p></section>}
 </section></div></main>;
}
