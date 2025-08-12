const isProduction = process.env.REACT_APP_BUILD_ENV === 'production';

// Get base domain from REACT_APP_APP_DOMAIN environment variable
const baseDomain = process.env.REACT_APP_APP_DOMAIN as string;

console.log('baseDomain', baseDomain);

export const APP_DOMAIN = isProduction 
  ? `https://app.${baseDomain}`
  : `http://${baseDomain}`;

// CBE (Cross Browser Extension) domain constants  
export const CBE_DOMAIN = isProduction
  ? `https://cbe.${baseDomain}`
  : `http://cbe.${baseDomain}`;
