// export type Keyword = {
//   word: string;
//   weight: number;
// };

// export default async function fetchKeywords(query: string): Promise<Keyword[]> {
//   const API_KEY = process.env.NEXT_PUBLIC_SCALE_SERP_API_KEY;
//   if (!API_KEY) throw new Error("Scale SERP API key is not set");
//   if (!query) throw new Error("Query is empty");

//   const url = `https://api.scaleserp.com/search?api_key=${API_KEY}&engine=google&q=${encodeURIComponent(query)}&gl=pl&hl=pl&output=json`;

//   const res = await fetch(url);
//   if (!res.ok) {
//     throw new Error(`Scale SERP request failed: ${res.status} ${res.statusText}`);
//   }

//   const data = await res.json();

//   const results: Keyword[] = (data.organic_results || [])
//     .slice(0, 10)
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     .map((item: any, index: number) => ({
//       word: item.title || item.link || `keyword${index + 1}`,
//       weight: 1 / (index + 1),
//     }));

//   return results;
// }

export type Keyword = {
  word: string;
  weight: number;
};

export default async function fetchKeywords(baseQuery: string): Promise<Keyword[]> {
  const API_KEY = process.env.NEXT_PUBLIC_SCALE_SERP_API_KEY;
  if (!API_KEY) throw new Error("Scale SERP API key is not set");
  if (!baseQuery) throw new Error("Query is empty");

  const queries = [
    baseQuery,
    `${baseQuery} trends`,
    `${baseQuery} tutorial`,
    `${baseQuery} guide`,
    `${baseQuery} tips`
  ];

  const allKeywords: Keyword[] = [];

  for (const q of queries) {
    const url = `https://api.scaleserp.com/search?api_key=${API_KEY}&engine=google&q=${encodeURIComponent(q)}&gl=pl&hl=pl&output=json`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`Scale SERP request failed for query "${q}": ${res.status} ${res.statusText}`);
      continue;
    }

    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organic: Keyword[] = (data.organic_results || []).map((item: any, index: number) => ({
      word: item.title || item.link || `keyword${index + 1}`,
      weight: 1 / (index + 1),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const related: Keyword[] = (data.related_searches || []).map((item: any, index: number) => ({
      word: item.query,
      weight: 0.5 / (index + 1),
    }));

    allKeywords.push(...organic, ...related);
  }

  const uniqueMap = new Map<string, Keyword>();
  for (const k of allKeywords) {
    if (!uniqueMap.has(k.word)) uniqueMap.set(k.word, k);
  }

  const uniqueKeywords = Array.from(uniqueMap.values()).sort((a, b) => b.weight - a.weight);

  return uniqueKeywords;
}
