const isProduction = process.env.REACT_APP_BUILD_ENV === 'production';

// Get base domain from REACT_APP_APP_DOMAIN environment variable
const baseDomain = process.env.REACT_APP_APP_DOMAIN as string;

// Get short domain from REACT_APP_APP_SHORT_DOMAIN environment variable
const shortDomain = process.env.REACT_APP_APP_SHORT_DOMAIN as string;

console.log('baseDomain', baseDomain);
console.log('shortDomain', shortDomain);

export const APP_DOMAIN = isProduction 
  ? `https://app.${baseDomain}`
  : `http://${baseDomain}`;

// Default short domain for link shortening
export const SHORT_DOMAIN = shortDomain;

// CBE (Cross Browser Extension) domain constants  
export const CBE_DOMAIN = isProduction
  ? `https://cbe.${baseDomain}`
  : `http://cbe.${baseDomain}`;
