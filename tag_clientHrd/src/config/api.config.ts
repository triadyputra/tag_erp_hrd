export const API_BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL belum diset');
  }
  return url.endsWith('/') ? url : `${url}/`;
})();