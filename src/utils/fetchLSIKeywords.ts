// src/utils/fetchLSIKeywords.ts

export type LSIKeyword = {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition_index: number;
};

export async function fetchLSIKeywordsDataForSEO(keyword: string): Promise<LSIKeyword[]> {
  const key = process.env.DATAFORSEO_API_KEY;
  const secret = process.env.DATAFORSEO_API_SECRET;
  if (!key || !secret) throw new Error("DATAFORSEO_API_KEY or DATAFORSEO_API_SECRET not set");

  const url = 'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live';

  const body = [
    {
      keywords: [keyword],
      location_code: 2616,
      language_code: 'pl',
      search_partners: false,
      sort_by: 'search_volume'
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
  const lsiKeywords: LSIKeyword[] = data.tasks?.[0]?.result?.map((item: any) => ({
    keyword: item.keyword || '',
    search_volume: item.search_volume ?? 0,
    cpc: item.cpc ?? 0,
    competition_index: item.competition_index ?? 0
  })) || [];

  return lsiKeywords;
}
