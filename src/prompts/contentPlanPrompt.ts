// export const getContentPlanPrompt = (
//   topics: string[],
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   articleDates: any
// ) => `
// You are a blog content planner for CROCODE Lab. Create unique titles for posts (not from the list of existing ones) and add a description and 10 relevant keywords in Polish, taking into account the categories for each article:

// ${topics.join(', ')}

// Create exactly ${articleDates.length} entries. Titles must be unique and non-repetitive. 

// (If necessary, take into account the current date)

// Output format:
// \`\`\`json
// [
//   {
//     "title": "Your unique title here",
//     "description": "Your unique description here",
//     "keywords": "keyword1, keyword2, ..., keyword10"
//   }, 
//   ...
// ]
// \`\`\`

// If a unique title can't be generated, return:
// \`\`\`json
// { "title": "Skipped", "description": "Skipped", "keywords": "Skipped" }
// \`\`\`

// Be creative and consistent.
// `;

export const getContentPlanPrompt = (
  topics: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  articleDates: any,
  keywordPool: { word: string; weight: number }[]
) => {
  const formattedKeywords = keywordPool
    .map(k => `${k.word} (${k.weight.toFixed(2)})`)
    .join(", ");

  return `
You are a blog content planner for CROCODE Lab. You are given a list of categories and a pool of keywords, each with an importance weight:
${formattedKeywords}

Your task is to generate unique titles and descriptions for each article depending on its category and keywords in Polish. You should:
- DO NOT generate keywords, use only those passed in as input.
- Select keywords (1 main and 4-5 additional) from the provided set that are suitable for each article and its category.
- Prefer keywords with higher weight, especially as the main keyword in the title.
- Make sure that articles do not have completely identical sets of keywords.
- Include the main keyword (most important) in the title.
- Include the main and additional keywords (not necessarily all) in a natural way in the description.
- Create unique, engaging titles.
- Generate exactly ${articleDates.length} articles in this order: ${topics.join(', ')}.

Output format:
\`\`\`json
[
  {
    "title": "Your unique title here",
    "description": "Your unique description here",
    "keywords": "keyword1, keyword2, ..., keyword5"
  }, 
  ...
]
\`\`\`

If a unique title can't be generated, return:
\`\`\`json
{ "title": "Skipped", "description": "Skipped", "keywords": "Skipped" }
\`\`\`

Be creative and consistent.
`;
};
