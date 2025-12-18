"use server";

import { VALID_ANALYTICS_FILTERS } from "@/lib/analytics/constants";
import { analyticsQuerySchema } from "@/lib/zod/schemas/analytics";
import { anthropic } from "@ai-sdk/anthropic";
import { createStreamableValue } from "ai/rsc";

function extractFirstJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0];
}

export async function generateFilters(prompt: string) {
  const stream = createStreamableValue();

  const schema = analyticsQuerySchema.pick({
    ...(VALID_ANALYTICS_FILTERS.reduce((acc, filter) => {
      acc[filter] = true;
      return acc;
    }, {}) as any),
  });

  (async () => {
    const fullPrompt =
      `${prompt}\n\n` +
      `Return ONLY a JSON object containing any of these optional keys:\n` +
      `${VALID_ANALYTICS_FILTERS.join(", ")}\n`;

    const { content } = await anthropic("claude-3-5-sonnet-latest").doGenerate({
      prompt: [
        {
          role: "user",
          content: [{ type: "text", text: fullPrompt }],
        },
      ],
      temperature: 0.4,
      maxOutputTokens: 300,
    });

    const text = content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    const jsonText = extractFirstJsonObject(text);
    if (!jsonText) {
      stream.update({});
      stream.done();
      return;
    }

    const parsedJson = JSON.parse(jsonText);
    const parsed = schema.safeParse(parsedJson);
    stream.update(parsed.success ? parsed.data : {});

    stream.done();
  })();

  return { object: stream.value };
}
