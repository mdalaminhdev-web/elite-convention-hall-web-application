import {useEffect,useState} from 'react';
export function useGalleryData(loader,deps=[]) {
  const [state,setState]=useState({loading:true,data:null,error:''});
  useEffect(()=>{
    let active=true;
    setState({loading:true,data:null,error:''});
    loader().then(data=>{if(active)setState({loading:false,data,error:''});})
      .catch(e=>{if(active)setState({loading:false,data:null,error:e.response?.status===404?'This album is no longer available.':'Could not load gallery. Please try again later.'});});
    return ()=>{active=false;};
  },deps);
  return state;
}
