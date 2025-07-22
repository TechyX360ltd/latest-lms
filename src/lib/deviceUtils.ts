// Device and location detection utilities

export function getDeviceType() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)/i.test(ua)) return 'mobile';
  return 'desktop';
}

export async function getUserLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return {
      city: data.city,
      country_name: data.country_name,
      country_code: data.country_code, // Add country_code
      ip: data.ip
    };
  } catch {
    return { city: null, country_name: null, country_code: null, ip: null };
  }
} 