// src/app/api/keywords/lsi/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchLSIKeywordsDataForSEO, LSIKeyword } from '@/utils/fetchLSIKeywords';
import { filterLSIKeywords } from '@/utils/filterLSIKeywords';

export async function POST(req: NextRequest) {
  const { keywords } = await req.json();

  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return NextResponse.json({ error: 'No keywords provided' }, { status: 400 });
  }

  try {
    // Получаем LSI слова для каждого ключевого слова
    const allLSIKeywords: LSIKeyword[] = [];

    for (const keyword of keywords) {
      const lsiKeywords = await fetchLSIKeywordsDataForSEO(keyword);
      allLSIKeywords.push(...lsiKeywords);
    }

    // Фильтруем и отбираем топ-15 LSI слов
    const filteredLSI = filterLSIKeywords(allLSIKeywords, 15);

    return NextResponse.json({ lsiKeywords: filteredLSI });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error fetching LSI keywords:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
