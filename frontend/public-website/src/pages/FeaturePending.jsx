import React from 'react';
import {Link} from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import {Icon} from '../components/Icon.jsx';
export default function FeaturePending({feature}){return <><Header/><main className="pending-page"><div className="container-wide"><p className="section-kicker">Development preview</p><h1>{feature}</h1><p>This page is planned for the next development phase and is not live yet. Return to the homepage to explore the implemented design foundation.</p><Link className="btn-gold" to="/#home">Return Home <Icon name="arrow"/></Link></div></main><Footer/></>}
