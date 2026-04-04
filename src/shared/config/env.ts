const fallbackApiUrl = 'https://b.sultonoway.uz';

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? fallbackApiUrl,
};
