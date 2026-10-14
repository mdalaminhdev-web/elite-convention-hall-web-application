import React from 'react';
import {Link} from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import {Icon} from '../components/Icon.jsx';
import {galleryApi} from '../api/gallery.js';
import {useGalleryData} from '../hooks/useGalleryData.js';
const loader=()=>galleryApi.albums();
export default function AllAlbums(){
 const {loading,data,error}=useGalleryData(loader,[]);
 return <><Header/><main className="gallery-page"><div className="gallery-page-banner"><div className="container-wide"><p className="section-kicker">OUR GALLERY</p><h1>Explore All <em>Albums</em></h1><p>Browse event albums and venue moments from Elite Convention Hall.</p></div></div>
 <div className="container-wide gallery-album-main"><Link className="gallery-back" to="/#gallery"><Icon name="chevron" className="flip-x" size={16}/> Back to Gallery</Link>
 {loading?<p role="status" className="gallery-message">Loading albums…</p>:error?<p role="alert" className="gallery-message">{error}</p>:data?.length===0?<p className="gallery-message">No albums have been published yet.</p>:
 <div className="gallery-album-grid">{data?.map(album=><article className="gallery-album-card" key={album.id}><Link to={`/gallery/${album.slug}`} className="gallery-album-image" aria-label={`View ${album.title} album`}>
 {album.coverUrl?<img src={album.coverUrl} alt="" loading="lazy"/>:<div className="gallery-cover-missing"/>}</Link><div className="gallery-album-body"><h2>{album.title}</h2><p>{album.description}</p><div className="gallery-album-footer"><span>{album.photoCount} Photos</span><Link to={`/gallery/${album.slug}`}>View Album <Icon name="arrow" size={15}/></Link></div></div></article>)}</div>}
 </div></main><Footer/></>;
}
