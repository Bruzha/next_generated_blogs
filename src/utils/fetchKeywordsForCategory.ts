// src/utils/fetchKeywordsForCategory.ts
export type Keyword = {
  word: string;
  weight: number;
};

export default async function fetchKeywordsDataForSEO(query: string): Promise<Keyword[]> {
  const key = process.env.DATAFORSEO_API_KEY;
  const secret = process.env.DATAFORSEO_API_SECRET;
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
