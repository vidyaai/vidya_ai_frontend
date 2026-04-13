export const LANDING_ROUTES = {
  home: '/',
  login: '/login',
  pricing: '/pricing',
  blog: '/blog',
  samplePapers: '/sample-papers',
  setUserType: '/set-user-type',
};

export const LANDING_EXTERNAL_URLS = {
  about: 'https://www.vidyaai.co/about',
  linkedin: 'https://www.linkedin.com/company/vidyaaai/',
  instagram: 'https://www.instagram.com/vidyaai.co',
  whatsapp:
    'https://wa.me/14692379220?text=I%20am%20interested%20to%20know%20more%20about%20VidyaAI',
  googleCalendar:
    'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1eumAna-P2wtjgNRwk4eBTKzGXrY-WACahNVhg3iXOgxZB3L7FlgsGu1vZYXe0qNWNY1gAAugU?gv=true',
};

export function openInSameTab(href) {
  if (typeof window === 'undefined') return;
  window.location.assign(href);
}

export function openInNewTab(href) {
  if (typeof window === 'undefined') return;
  window.open(href, '_blank', 'noopener,noreferrer');
}
