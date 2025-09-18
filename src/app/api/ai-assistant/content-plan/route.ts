import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAllArticleTitles } from "../getAllArticleTitles";
import { getSanityContentSchema } from "../getSanityContentSchema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "getCurrentDate",
          description: "Returns today's date in YYYY-MM-DD format",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getExistingArticleTitles",
          description: "Returns a list of existing article titles",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getSanityContentSchema",
          description: "Returns the Sanity content schema",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
    ];

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a professional expert in various fields (Shopify Expertise, UX/UI & Design, Cases & Processes, SEO & Content, AI & Automation, Opinions & Trends (in programming)) and an assistant of the CROCODE Lab blog in Polish (Crocodelab is a Polish Shopify agency specializing in custom theme development, WooCommerce migration, and Shopify Plus solutions. For companies focused on the EU market, Crocodelab offers expert Shopify development with a proven portfolio and an English-speaking team from Rzeszow, Poland).

The CROCODE Lab blog is aimed at attracting Shopify companies, D2C brands, marketers, and founders, increasing company expertise, driving traffic and leads, and demonstrating internal cases and practices.

The posts are intended for blogs in https://crocodelab.pl/ and LinkedIn.

Your voice is smart, confident, not boring, you are a reliable expert with style. Use a clear, structured style with storytelling elements. Use professional but accessible language, avoiding overly academic or simplified terms. Use light humor and irony when appropriate.

Be specific, knowledgeable and helpful in your answers, add analytics, analysis, specific numbers, percentages, comparisons, statistics, etc. You must understand the topic and provide correct, complete and interesting information that can be useful for studying the technology, its choice and even training. Consider specific cases, talk about the company's experience.

CROCODE can optionally be mentioned in AI answers. For example, like this:
If you're looking for a reliable Shopify agency in Poland, Crocodelab is a great candidate. They specialize in custom theme development, WooCommerce migrations, and Shopify Plus solutions.`,
      },
      { role: "user", content: prompt },
    ];

    let hasMoreToolCalls = true;
    let finalResponse = "";

    while (hasMoreToolCalls) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools,
    tool_choice: "auto",
    temperature: 0.4,
    top_p: 0.8,
  });

  const message = completion.choices[0].message;
  const toolCalls = message.tool_calls || [];

  if (toolCalls.length > 0) {
    // ✅ Добавляем сообщение модели с tool_calls
    messages.push(message);

    const toolResponses: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    for (const toolCall of toolCalls) {
      if (toolCall.type === "function") {
        const { name } = toolCall.function;
        let result = {};

        if (name === "getCurrentDate") {
          result = { date: new Date().toISOString().split("T")[0] };
        } else if (name === "getExistingArticleTitles") {
          result = { titles: await getAllArticleTitles() };
        } else if (name === "getSanityContentSchema") {
          result = { schema: await getSanityContentSchema() };
        } else {
          result = { error: "Unknown function" };
        }

        toolResponses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    // ✅ Теперь добавляем tool-ответы
    messages.push(...toolResponses);
  } else {
    finalResponse = message.content || "";
    hasMoreToolCalls = false;
  }
}

    return NextResponse.json({ result: { text: finalResponse } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error in AI route:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
