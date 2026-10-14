import {useEffect,useState} from 'react';
import {getSiteSection} from '../api/site.js';
export function useSiteSection(section){
 const [state,setState]=useState({value:null,loading:true,error:false});
 useEffect(()=>{let live=true;setState({value:null,loading:true,error:false});getSiteSection(section).then(value=>{if(live)setState({value,loading:false,error:false});}).catch(()=>{if(live)setState({value:null,loading:false,error:true});});return()=>{live=false;};},[section]);
 return state;
}
