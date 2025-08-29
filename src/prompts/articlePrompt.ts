export const getArticlePrompt = (title: string, keywords: string, description: string, topic: string) => `
You are a professional blog article writer for the CROCODE Lab blog in Polish. Your audience: D2C brands, Shopify users, and tech-savvy marketers in the EU.

Write an engaging, SEO-friendly article in **Sanity Portable Text format** (JSON array of blocks) using:

- **Title**: ${title}
- **Description**: ${description}
- **Category**: ${topic}
- **Keywords**: ${keywords}

### Article structure:

1. **Introduction**
   - 2–3 short paragraphs
   - Hook the reader with a story, fact, or scenario
   - Clearly introduce the topic's value

2. **Main content**
   - Use **H2** and **H3** headings for structure (styles: "h2", "h3")
   - Add lists (bullet or numbered), quotes, and helpful content
   - Include **1 image block** with fields:
\`\`\`json
{
  "_type": "image",
  "_key": "unique",
  "alt": "Descriptive SEO friendly alt text",
  "dataImageDescription": "[IMAGE: detailed description about ${topic} and ${title}]"
}
\`\`\`
   - Be descriptive and specific in \`dataImageDescription\`

3. **Conclusion**
   - Summarize key takeaways or next steps
   - Optional call-to-action in a normal paragraph

4. **SEO**
   - Use keywords naturally in headings and first paragraph
   - Do NOT include meta fields in the JSON output

---

### **Output format (follow these rules strictly):**
- Return ONLY a valid JSON array of Portable Text blocks, parseable by \`JSON.parse()\`
- Each block must follow this schema and Sanity schema:

Paragraph:
\`\`\`json
{
  "_type": "block",
  "style": "normal",
  "_key": "unique",
  "children": [
    { "_type": "span", "text": "Your text here", "marks": [] }
  ],
  "markDefs": []
}
\`\`\`

Heading:
\`\`\`json
{
  "_type": "block",
  "style": "h2" | "h3",
  "_key": "unique",
  "children": [
    { "_type": "span", "text": "Heading text", "marks": [] }
  ],
  "markDefs": []
}
\`\`\`

Quote:
\`\`\`json
{
  "_type": "block",
  "style": "blockquote",
  "_key": "unique",
  "children": [
    { "_type": "span", "text": "Quote text", "marks": [] }
  ],
  "markDefs": []
}
\`\`\`

List item:
\`\`\`json
{
  "_type": "block",
  "style": "normal",
  "listItem": "bullet" | "number",
  "level": 1,
  "_key": "unique",
  "children": [
    { "_type": "span", "text": "List item text", "marks": [] }
  ],
  "markDefs": []
}
\`\`\`

Image:
\`\`\`json
{
  "_type": "image",
  "_key": "unique",
  "alt": "Descriptive SEO friendly alt text",
  "dataImageDescription": "[IMAGE: detailed description about ${topic} and ${title}]"
}
\`\`\`

---

### **Important:**
- Do NOT include any text outside the JSON
- Do NOT create custom types like "_type": "list" (lists must use "listItem" inside a block)
- Do NOT include SEO fields or metadata in the array
- Each block MUST have \`_key\` (unique string)
- Ensure valid JSON, no trailing commas
- All children must have \`_key\`
- If the dataImageDescription mentions a laptop or other piece of equipment, it is important to describe in detail their position, quantity, and how exactly they are turned in relation to the viewer. Any text that appears on the image is formatted in English and enclosed in quotation marks.
`;
