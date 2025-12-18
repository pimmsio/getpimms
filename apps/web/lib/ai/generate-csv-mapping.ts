"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

const csvMappingSchema = z.object({
  link: z
    .string()
    .optional()
    .describe("The shortlink (link), including the domain and path."),
  url: z.string().optional().describe("The full URL of the shortlink"),
  title: z.string().optional().describe("The title of the shortlink"),
  description: z.string().optional().describe("The description of the shortlink"),
  tags: z
    .string()
    .optional()
    .describe(
      "A comma-separated list of tags for shortlink organization (NOT to be mapped to a description).",
    ),
  createdAt: z
    .string()
    .optional()
    .describe("The date and time the shortlink was created (createdAt)"),
});

function extractFirstJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0];
}

export async function generateCsvMapping(
  fieldColumns: string[],
  firstRows: Record<string, string>[],
) {
  const stream = createStreamableValue();

  (async () => {
    const prompt =
      `The following columns are the headings from a CSV import file for importing a company's short links. ` +
      `Map these column names to the correct fields in our database (link, url, title, description, tags, createdAt) by providing the matching column name for each field.` +
      `You may also consult the first few rows of data to help you make the mapping, but you are mapping the columns, not the values. ` +
      `If you are not sure or there is no matching column, omit the value.\n\n` +
      `Return ONLY a JSON object with optional keys: link, url, title, description, tags, createdAt.\n\n` +
      `Columns:\n${fieldColumns.join(",")}\n\n` +
      `First few rows of data:\n` +
      firstRows.map((row) => JSON.stringify(row)).join("\n");

    const { content } = await anthropic("claude-3-5-sonnet-latest").doGenerate({
      prompt: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
      temperature: 0.2,
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
    const parsed = csvMappingSchema.safeParse(parsedJson);

    stream.update(parsed.success ? parsed.data : {});
    stream.done();
  })();

  return { object: stream.value };
}
