const fallbackApiUrl = 'https://b.sultonoway.uz';

function normalizeApiUrl(value: string | undefined) {
  const url = value?.trim() || fallbackApiUrl;
  return url.replace(/\/+$/, '');
}

export const env = {
  apiUrl: normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined),
};
