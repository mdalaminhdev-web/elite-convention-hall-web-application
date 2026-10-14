import React from 'react';
import {Route, Routes} from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import {Facilities,Vendors,Reviews,FAQ,Contact} from './sections/PublicContent.jsx';
import Gallery from './sections/Gallery.jsx';
import AllAlbums from './pages/AllAlbums.jsx';
import AlbumDetails from './pages/AlbumDetails.jsx';
import './gallery.css';
import FeaturePending from './pages/FeaturePending.jsx';
import QueryCalendar from './sections/QueryCalendar.jsx';
import EventInquiry from './pages/EventInquiry.jsx';
import './inquiry.css';
function Home(){return <><a className="skip-link" href="#main-content">Skip to main content</a><Header/><main id="main-content"><Hero/><About/><Gallery/><QueryCalendar/><Facilities/><Vendors/><Reviews/><FAQ/><Contact/></main><Footer/><div className="dev-ribbon" role="note">Development preview · Imagery cropped from supplied PRD mockups, not verified venue photographs</div></>}
export default function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/gallery" element={<AllAlbums/>}/><Route path="/gallery/:slug" element={<AlbumDetails/>}/><Route path="/inquiry" element={<EventInquiry/>}/><Route path="*" element={<FeaturePending feature="Page Not Found"/>}/></Routes>}
