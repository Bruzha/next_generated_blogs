  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getContentPlanPrompt = (topics: string[], existingTitles: string[], exampleContentPlan: string, articleDates: any) => `
You are a blog post title and keyword generator for the CROCODE Lab blog's content plan for the next month.

Your goal is to create a unique title for your blog post and a list of 10 relevant keywords in English for each topic in the list: "${topics}". The number of titles and keyword sets should be = ${articleDates.length}, titles should not be repeated.
Ensure the generated title is NOT one of the following existing titles: ${existingTitles.join(', ')}.

Here is an example of the content plan format:
${exampleContentPlan}

Be creative.


**IMPORTANT:** Respond in JSON format, as an array of objects:
\`\`\`json
[
  {
    "title": "Title 1",
    "keywords": "keyword1, keyword2, ..., keyword10"
  },
  {
    "title": "Title 2",
    "keywords": "keyword1, keyword2, ..., keyword10"
  },
  ...
]
\`\`\`

If you can't generate a unique title for a topic, return:
\`\`\`json
{ "title": "Skipped", "keywords": "Skipped" }
\`\`\`
`;
