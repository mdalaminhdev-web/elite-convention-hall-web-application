import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Icon} from '../components/Icon.jsx';
import {galleryApi} from '../api/gallery.js';
import {useGalleryData} from '../hooks/useGalleryData.js';
const loadFeatured=()=>galleryApi.featured();
export default function Gallery(){
 const {loading,data:albums,error}=useGalleryData(loadFeatured,[]);
 const [current,setCurrent]=useState(0);
 useEffect(()=>setCurrent(0),[albums]);
 const cards=albums??[];
 const go=change=>setCurrent(v=>(v+change+cards.length)%cards.length);
 const featured=cards[current];
 return <section id="gallery" className="gallery-preview" aria-labelledby="gallery-preview-heading">
  <div className="container-wide gallery-preview-content">
   <p className="section-kicker">OUR GALLERY</p><h2 id="gallery-preview-heading">Moments Made <em>Memorable</em></h2>
   <p className="gallery-intro">Explore stunning setups, elegant celebrations, and unforgettable events at Elite Convention Hall.</p>
   {loading?<p role="status" className="gallery-message">Loading featured albums…</p>:error?<p role="alert" className="gallery-message">{error}</p>:
     cards.length===0?<div className="gallery-message">There are no published featured albums yet. Visit All Albums to see the full collection when published.</div>:
    <div className="gallery-slider" aria-roledescription="carousel" aria-label="Featured photo albums">
      {[-2,-1,0,1,2].filter(offset=>cards.length>1 || offset===0).map(offset=>{
        if(cards.length<=2&&Math.abs(offset)>1)return null;
        const index=(current+offset+cards.length)%cards.length;
        const album=cards[index];
        return <Link key={`${offset}:${album.id}`} to={`/gallery/${album.slug}`} className={`gallery-slide gallery-slide-${offset+2} ${offset===0?'gallery-slide-current':''}`} tabIndex={offset===0?0:-1} aria-hidden={offset!==0?'true':undefined}>
          {album.coverUrl?<img src={album.coverUrl} alt="" loading={offset===0?'eager':'lazy'}/>:<div className="gallery-cover-missing"/>}
          <div className="gallery-slide-copy"><span className="gallery-overline">ELITE CONVENTION HALL</span><h3>{album.title}</h3><p>{album.description}</p><span className="gallery-count">{album.photoCount} Photos · View Photos <Icon name="arrow" size={15}/></span></div>
        </Link>;
      })}
      {cards.length>1&&<div className="gallery-slide-controls"><button type="button" onClick={()=>go(-1)} aria-label="Previous featured album"><Icon name="chevron" className="flip-x"/></button><span role="status" aria-live="polite">{current+1} / {cards.length}</span><button type="button" onClick={()=>go(1)} aria-label="Next featured album"><Icon name="chevron"/></button></div>}
    </div>}
   <Link className="btn-gold gallery-view-all" to="/gallery"><Icon name="photo" size={18}/> View All Albums <Icon name="arrow" size={18}/></Link>
   {featured&&<span className="sr-only">Selected featured album: {featured.title}</span>}
  </div>
 </section>;
}
