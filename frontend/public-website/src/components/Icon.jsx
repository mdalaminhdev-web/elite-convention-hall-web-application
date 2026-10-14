import React from 'react';
const paths={
  arrow:<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  diamond:<><path d="m6 3-4 7 10 11 10-11-4-7H6Z"/><path d="M2 10h20M9 3l3 18 3-18"/></>,
  users:<><circle cx="9" cy="8" r="3"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M18 11a3 3 0 1 0-1.4-5.7M18 15a6 6 0 0 1 4 6"/></>,
  spark:<><path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z"/></>,
  heart:<><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/></>,
  menu:<path d="M4 6h16M4 12h16M4 18h16"/>,
  close:<path d="M5 5 19 19M19 5 5 19"/>,
  chevron:<path d="m9 18 6-6-6-6"/>,
  pin:<><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  photo:<><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 18 6-6 4 4 3-3 5 5"/></>,
  mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></>,
};
export function Icon({name,size=20,className='', ...rest}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>{paths[name]??paths.spark}</svg>;
}
