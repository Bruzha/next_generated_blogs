// src/utils/filterLSIKeywords.ts

import { LSIKeyword } from './fetchLSIKeywords';

const POLISH_STOP_WORDS = new Set([
  'i', 'w', 'na', 'z', 'do', 'o', 'od', 'po', 'za', 'dla', 'przez', 'przy',
  'a', 'ale', 'bez', 'czy', 'jak', 'je', 'jest', 'już', 'lub', 'może',
  'nie', 'niż', 'by', 'co', 'gdy', 'go', 'jej', 'jego', 'ma', 'mi', 'my',
  'nas', 'nich', 'nie', 'no', 'pan', 'se', 'się', 'też', 'to', 'tu', 'ty',
  'was', 'ze', 'the', 'and', 'or', 'of', 'in', 'for', 'with', 'on', 'at',
  'as', 'an', 'be', 'is', 'are', 'was', 'were'
]);

function extractWords(keywords: LSIKeyword[]): { word: string; totalWeight: number }[] {
  const wordWeights = new Map<string, number>();

  for (const kw of keywords) {
    const words = kw.keyword.toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3);

    const weight = kw.search_volume * (1 + kw.cpc) / (1 + kw.competition_index);

    for (const word of words) {
      if (!POLISH_STOP_WORDS.has(word)) {
        const currentWeight = wordWeights.get(word) || 0;
        wordWeights.set(word, currentWeight + weight);
      }
    }
  }

  return Array.from(wordWeights.entries()).map(([word, totalWeight]) => ({
    word,
    totalWeight
  }));
}

export function filterLSIKeywords(lsiKeywords: LSIKeyword[], topN: number = 15): string[] {
  if (lsiKeywords.length === 0) return [];

  const words = extractWords(lsiKeywords);

  words.sort((a, b) => b.totalWeight - a.totalWeight);

  const topWords = words.slice(0, topN).map(w => w.word);

  return topWords;
}
