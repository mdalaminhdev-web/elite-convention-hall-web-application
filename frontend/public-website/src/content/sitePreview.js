// Phase 6 PRD-derived preview content. These are not live CMS records.
// Reference photographs were cropped from PRD concept screenshots, not confirmed venue assets.
// Change media paths to the client's approved originals before public deployment.
export const media = {
  hero: '/media/reference-hero.webp',
  about: '/media/reference-about.webp',
  entrance: '/media/reference-entrance.webp',
  hall: '/media/reference-hall.webp',
  stage: '/media/reference-stage.webp',
  footer: '/media/reference-footer.webp',
};

export const hero = {
  eyebrow: 'Celebrate Your Special Moments With Us',
  titleStart: 'A Perfect Venue for Your',
  titleEmphasis: 'Unforgettable Events',
  description: 'From weddings and receptions to corporate gatherings and special celebrations, Elite Convention Hall offers a beautiful setting for memorable occasions.',
  cta: 'Check Venue Availability',
  disclaimer: 'Select your preferred event date and submit your inquiry. Our team will confirm availability with you.',
};

export const about = {
  eyebrow: 'About Us',
  titleStart: 'About Elite',
  titleEmphasis: 'Convention Hall',
  intro: 'Elite Convention Hall brings a thoughtful setting to weddings, receptions, corporate gatherings and special celebrations.',
  story: 'Our focus is on professional service, warm hospitality and an organized event experience. Explore our venue presentation and share your event plans with our team.',
  highlights: [
    { icon: 'diamond', title: 'Elegant Venue', description: 'Thoughtfully presented spaces for memorable occasions.' },
    { icon: 'users', title: 'Professional Support', description: 'A service approach centered on event experiences.' },
    { icon: 'spark', title: 'Modern Facilities', description: 'Discover the confirmed amenities in our facilities section.' },
    { icon: 'heart', title: 'Memorable Experiences', description: 'A setting for celebrations worth remembering.' },
  ],
  photos: [
    { src: media.entrance, label: 'Grand Entrance' },
    { src: media.hall, label: 'Main Hall' },
    { src: media.stage, label: 'Stage Setup' },
  ],
};

export const primaryLinks = [
  {label:'Home', hash:'home'},
  {label:'Query Calendar', hash:'query-calendar'},
  {label:'Gallery', hash:'gallery'},
  {label:'Facilities', hash:'facilities'},
  {label:'About Us', hash:'about'},
  {label:'Contact', hash:'contact'},
];

export const footerLinks = [
  {label:'Home', hash:'home'},
  {label:'Query Calendar', hash:'query-calendar'},
  {label:'Gallery', hash:'gallery'},
  {label:'Facilities', hash:'facilities'},
  {label:'About Us', hash:'about'},
  {label:'FAQ', hash:'faq'},
  {label:'Contact Us', hash:'contact'},
];
