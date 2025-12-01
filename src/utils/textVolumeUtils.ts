// src/utils/textVolumeUtils.ts

/**
 * Подсчитывает количество символов в статье (без пробелов и HTML-тегов)
 * из Sanity Portable Text формата
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function countTextCharacters(content: any[]): number {
  if (!Array.isArray(content)) return 0;

  let totalChars = 0;

  for (const block of content) {
    // Обрабатываем только текстовые блоки (не изображения)
    if (block._type === 'block' && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (child._type === 'span' && typeof child.text === 'string') {
          // Удаляем все пробелы и считаем символы
          const textWithoutSpaces = child.text.replace(/\s/g, '');
          totalChars += textWithoutSpaces.length;
        }
      }
    }
  }

  return totalChars;
}

/**
 * Создаёт промпт для добивания объёма статьи
 */
export function getExtendVolumePrompt(
  title: string,
  keywords: string,
  description: string,
  topic: string,
  currentCharCount: number,
  targetCharCount: number
): string {
  const missingChars = targetCharCount - currentCharCount;

  return `You are continuing to write a blog article for CROCODE Lab in Polish.

**Current article details:**
- Title: ${title}
- Description: ${description}
- Category: ${topic}
- Keywords: ${keywords}

**Current text volume:** ${currentCharCount} characters (without spaces)
**Required volume:** ${targetCharCount} characters (without spaces)
**Missing:** ${missingChars} characters (without spaces)

**Your task:**
Add approximately ${missingChars} characters of valuable content to this article. The content should:
- Continue naturally from the existing article
- Provide additional useful information, examples, or details on the topic
- Maintain the same professional tone and style
- Include specific metrics, examples, or practical advice
- Be in Polish language
- Follow SEO and Generative Engine Optimization best practices

**Output format:**
Return ONLY additional content blocks in Sanity Portable Text format (JSON array). The blocks should seamlessly extend the existing article. Use the same format as specified in the original article prompt:

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

You can use:
- Regular paragraphs (style: "normal")
- H3 headings (style: "h3") - formulated as questions
- Lists (with "listItem": "bullet" or "number")
- Quotes (style: "blockquote")

**Important:**
- Do NOT include any text outside the JSON
- Each block MUST have unique \`_key\`
- Return ONLY valid JSON array
- Add content that brings real value, not filler text
- Focus on quality over quantity, but ensure you add approximately ${missingChars} characters`;
}

/**
 * Расширяет контент статьи через API
 */
export async function extendArticleContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentContent: any[],
  title: string,
  keywords: string,
  description: string,
  topic: string,
  currentCharCount: number,
  targetCharCount: number = 3000
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | null> {
  try {
    const prompt = getExtendVolumePrompt(
      title,
      keywords,
      description,
      topic,
      currentCharCount,
      targetCharCount
    );

    const response = await fetch('/api/ai-assistant/content-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok || !data.result || !data.result.text) {
      console.error("Error extending article content:", data.error || "Unknown error");
      return null;
    }

    let additionalContent = data.result.text.trim();

    // Очищаем от markdown блоков
    if (additionalContent.startsWith("```json")) additionalContent = additionalContent.substring(7);
    if (additionalContent.endsWith("```")) additionalContent = additionalContent.slice(0, -3);

    // Удаляем примечания
    const noteIndex = additionalContent.indexOf('Note:');
    if (noteIndex !== -1) additionalContent = additionalContent.substring(0, noteIndex);

    additionalContent = additionalContent.replace(/\*\*/g, '');

    let parsedAdditionalContent = null;
    try {
      parsedAdditionalContent = JSON.parse(additionalContent);
    } catch (parseError) {
      console.error("❌ Failed to parse extended content JSON:", parseError);
      return null;
    }

    if (!Array.isArray(parsedAdditionalContent)) {
      console.error("❌ Extended content is not an array");
      return null;
    }

    // Объединяем существующий контент с новым
    return [...currentContent, ...parsedAdditionalContent];
  } catch (error) {
    console.error("Error in extendArticleContent:", error);
    return null;
  }
}
