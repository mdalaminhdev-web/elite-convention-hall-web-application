import React,{useEffect,useRef} from 'react';
import {Icon} from './Icon.jsx';
export default function GalleryLightbox({photos,index,onChange,onClose,albumTitle}){
 const closeRef=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement;
  const priorOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  closeRef.current?.focus();
  function key(e){
   if(e.key==='Escape'){e.preventDefault();onClose();}
   else if(e.key==='ArrowLeft'){e.preventDefault();onChange((index-1+photos.length)%photos.length);}
   else if(e.key==='ArrowRight'){e.preventDefault();onChange((index+1)%photos.length);}
   else if(e.key==='Tab'){
     const buttons=Array.from(document.querySelectorAll('.gallery-lightbox button:not([disabled])'));
     const at=buttons.indexOf(document.activeElement);
     if(e.shiftKey&&at<=0){e.preventDefault();buttons.at(-1)?.focus();}
     else if(!e.shiftKey&&at===buttons.length-1){e.preventDefault();buttons[0]?.focus();}
   }
  }
  window.addEventListener('keydown',key);
  return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=priorOverflow;previous?.focus?.();};
 },[index,photos,onChange,onClose]);
 const start=useRef(null);
 const photo=photos[index];
 if(!photo)return null;
 return <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${albumTitle} image viewer`} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
   <div className="lightbox-toolbar"><span>{index+1} / {photos.length}</span><button type="button" ref={closeRef} onClick={onClose} aria-label="Close image preview"><Icon name="close"/></button></div>
   <div className="lightbox-stage" onTouchStart={e=>{start.current=e.touches[0]?.clientX??null;}} onTouchEnd={e=>{if(start.current===null)return;let d=e.changedTouches[0].clientX-start.current;start.current=null;if(Math.abs(d)>60)onChange((index+(d<0?1:-1)+photos.length)%photos.length);}}>
     {photos.length>1&&<button className="lightbox-step" onClick={()=>onChange((index-1+photos.length)%photos.length)} aria-label="Previous photograph"><Icon name="chevron" className="flip-x" size={26}/></button>}
     <figure><img src={photo.url} alt={photo.altText||photo.caption||`${albumTitle} photograph ${index+1}`} /><figcaption>{photo.caption||albumTitle}</figcaption></figure>
     {photos.length>1&&<button className="lightbox-step" onClick={()=>onChange((index+1)%photos.length)} aria-label="Next photograph"><Icon name="chevron" size={26}/></button>}
   </div>
 </div>;
}
