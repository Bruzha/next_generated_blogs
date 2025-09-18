// export type Keyword = {
//   word: string;
//   weight: number;
// };

// async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<Response | null> {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const res = await fetch(url);
//       if (res.ok) return res;

//       console.warn(
//         `⚠️ Scale SERP request failed (status ${res.status}). Retry ${i + 1}/${retries} after ${delay}ms...`
//       );
//       await new Promise(r => setTimeout(r, delay));
//       delay *= 2;
//     } catch (err) {
//       console.error(`❌ Fetch error on attempt ${i + 1}:`, err);
//       await new Promise(r => setTimeout(r, delay));
//     }
//   }
//   return null;
// }

// export default async function fetchKeywords(baseQuery: string): Promise<Keyword[]> {
//   const API_KEY = process.env.NEXT_PUBLIC_SCALE_SERP_API_KEY;
//   if (!API_KEY) throw new Error("Scale SERP API key is not set");
//   if (!baseQuery) throw new Error("Query is empty");

//   const queries = [
//     baseQuery,
//     `${baseQuery} trends`,
//     `${baseQuery} tutorial`,
//     `${baseQuery} guide`,
//     `${baseQuery} tips`,
//   ];

//   const allKeywords: Keyword[] = [];

//   for (const q of queries) {
//     const url = `https://api.scaleserp.com/search?api_key=${API_KEY}&engine=google&q=${encodeURIComponent(
//       q
//     )}&gl=pl&hl=pl&output=json`;

//     const res = await fetchWithRetry(url, 3, 2000);
//     if (!res) {
//       console.warn(`❌ Scale SERP request completely failed for query "${q}"`);
//       continue;
//     }

//     try {
//       const data = await res.json();

//       const organic: Keyword[] = (data.organic_results || []).map(
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (item: any, index: number) => ({
//           word: item.title || item.link || `keyword${index + 1}`,
//           weight: 1 / (index + 1),
//         })
//       );

//       const related: Keyword[] = (data.related_searches || []).map(
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (item: any, index: number) => ({
//           word: item.query,
//           weight: 0.5 / (index + 1),
//         })
//       );

//       allKeywords.push(...organic, ...related);
//     } catch (err) {
//       console.error(`❌ Failed to parse Scale SERP response for "${q}":`, err);
//     }
//   }

//   const uniqueMap = new Map<string, Keyword>();
//   for (const k of allKeywords) {
//     if (!uniqueMap.has(k.word)) uniqueMap.set(k.word, k);
//   }

//   const uniqueKeywords = Array.from(uniqueMap.values()).sort(
//     (a, b) => b.weight - a.weight
//   );

//   return uniqueKeywords;
// }
// src/utils/fetchKeywordsDataForSEO.ts
// export type Keyword = {
//   word: string;
//   weight: number;
// };

// async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<Response | null> {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const res = await fetch(url);
//       if (res.ok) return res;

//       console.warn(
//         `⚠️ Scale SERP request failed (status ${res.status}). Retry ${i + 1}/${retries} after ${delay}ms...`
//       );
//       await new Promise(r => setTimeout(r, delay));
//       delay *= 2;
//     } catch (err) {
//       console.error(`❌ Fetch error on attempt ${i + 1}:`, err);
//       await new Promise(r => setTimeout(r, delay));
//     }
//   }
//   return null;
// }

// export default async function fetchKeywords(baseQuery: string): Promise<Keyword[]> {
//   const API_KEY = process.env.NEXT_PUBLIC_SCALE_SERP_API_KEY;
//   if (!API_KEY) throw new Error("Scale SERP API key is not set");
//   if (!baseQuery) throw new Error("Query is empty");

//   const queries = [
//     baseQuery,
//     `${baseQuery} trends`,
//     `${baseQuery} tutorial`,
//     `${baseQuery} guide`,
//     `${baseQuery} tips`,
//   ];

//   const allKeywords: Keyword[] = [];

//   for (const q of queries) {
//     const url = `https://api.scaleserp.com/search?api_key=${API_KEY}&engine=google&q=${encodeURIComponent(
//       q
//     )}&gl=pl&hl=pl&output=json`;

//     const res = await fetchWithRetry(url, 3, 2000);
//     if (!res) {
//       console.warn(`❌ Scale SERP request completely failed for query "${q}"`);
//       continue;
//     }

//     try {
//       const data = await res.json();

//       const organic: Keyword[] = (data.organic_results || []).map(
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (item: any, index: number) => ({
//           word: item.title || item.link || `keyword${index + 1}`,
//           weight: 1 / (index + 1),
//         })
//       );

//       const related: Keyword[] = (data.related_searches || []).map(
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         (item: any, index: number) => ({
//           word: item.query,
//           weight: 0.5 / (index + 1),
//         })
//       );

//       allKeywords.push(...organic, ...related);
//     } catch (err) {
//       console.error(`❌ Failed to parse Scale SERP response for "${q}":`, err);
//     }
//   }

//   const uniqueMap = new Map<string, Keyword>();
//   for (const k of allKeywords) {
//     if (!uniqueMap.has(k.word)) uniqueMap.set(k.word, k);
//   }

//   const uniqueKeywords = Array.from(uniqueMap.values()).sort(
//     (a, b) => b.weight - a.weight
//   );

//   return uniqueKeywords;
// }
// src/utils/fetchKeywordsDataForSEO.ts

// src/utils/fetchKeywordsDataForSEO.ts

export type Keyword = {
  word: string;
  weight: number;
};

export default async function fetchKeywordsDataForSEO(query: string): Promise<Keyword[]> {
  const key = process.env.DATAFORSEO_API_KEY;
  const secret = process.env.DATAFORSEO_API_SECRET;
  console.log('DATAFORSEO_API_KEY:', process.env.DATAFORSEO_API_KEY);
  console.log('DATAFORSEO_API_SECRET:', process.env.DATAFORSEO_API_SECRET);
  if (!key || !secret) throw new Error("DATAFORSEO_API_KEY or DATAFORSEO_API_SECRET not set");

  const url = 'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live';

  const body = [
    {
      keywords: [query],
      location_code: 2616,
      language_code: 'pl',
      sort_by: 'relevance'
    }
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64')
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keywords: Keyword[] = data.tasks?.[0]?.result?.map((item: any) => {
    const searchVol = item.search_volume ?? 1;
    const cpc = item.cpc ?? 0;
    const kd = item.kd ?? 0;

    return {
      word: item.keyword || `keyword-${Math.random().toString(36).slice(2, 8)}`,
      weight: searchVol * (1 + cpc) / (1 + kd)
    };
  }) || [];

  return keywords;
}
