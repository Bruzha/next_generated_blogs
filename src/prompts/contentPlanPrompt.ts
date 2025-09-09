export const getContentPlanPrompt = (
  topics: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  articleDates: any
) => `
You are a blog content planner for CROCODE Lab. Create unique titles for posts (not from the list of existing ones) and add a description and 10 relevant keywords in Polish, taking into account the categories for each article:

${topics.join(', ')}

Create exactly ${articleDates.length} entries. Titles must be unique and non-repetitive. 

(If necessary, take into account the current date)

Output format:
\`\`\`json
[
  {
    "title": "Your unique title here",
    "description": "Your unique description here",
    "keywords": "keyword1, keyword2, ..., keyword10"
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
