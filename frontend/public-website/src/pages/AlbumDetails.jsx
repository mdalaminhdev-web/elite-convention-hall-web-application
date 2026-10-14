import React,{useState,useCallback} from 'react';
import {Link,useParams} from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import {Icon} from '../components/Icon.jsx';
import GalleryLightbox from '../components/GalleryLightbox.jsx';
import {galleryApi} from '../api/gallery.js';
import {useGalleryData} from '../hooks/useGalleryData.js';
export default function AlbumDetails(){
 const {slug}=useParams();const [index,setIndex]=useState(null);
 const loader=useCallback(()=>galleryApi.album(slug),[slug]);
 const {loading,data,error}=useGalleryData(loader,[loader]);
 const close=useCallback(()=>setIndex(null),[]);
 const photos=data?.photos??[];const album=data?.album;
 return <><Header/><main className="gallery-page"><div className="gallery-page-banner gallery-album-banner"><div className="container-wide">
  <nav className="gallery-breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><Icon name="chevron" size={14}/><Link to="/gallery">Gallery</Link><Icon name="chevron" size={14}/><span>{album?.title||'Album'}</span></nav>
  {album?<><h1>{album.title}</h1><p>{album.description}</p><div className="gallery-total"><Icon name="photo" size={18}/> {photos.length} Photos</div></>:<h1>{loading?'Loading Album…':'Album Unavailable'}</h1>}</div></div>
 <div className="container-wide gallery-album-main"><Link className="gallery-back" to="/gallery"><Icon name="chevron" className="flip-x" size={16}/> All Albums</Link>
 {loading?<p role="status" className="gallery-message">Loading photographs…</p>:error?<p role="alert" className="gallery-message">{error}</p>:photos.length===0?<p className="gallery-message">This published album has no photographs yet.</p>:
 <div className="gallery-photo-grid">{photos.map((photo,i)=><button type="button" key={photo.id} className={`gallery-photo ${i===0?'gallery-photo-lead':''}`} onClick={()=>setIndex(i)} aria-label={`View photograph ${i+1} of ${photos.length}`}>
 <img src={photo.url} alt={photo.altText||photo.caption||`${album.title} photo ${i+1}`} loading={i<3?'eager':'lazy'}/><span><Icon name="photo" size={18}/> View Photo</span></button>)}</div>}
 </div></main><Footer/>{index!==null&&photos[index]&&<GalleryLightbox photos={photos} index={index} onChange={setIndex} onClose={close} albumTitle={album?.title||'Gallery'}/>}</>;
}
