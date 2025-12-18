import { handleAndReturnErrorResponse } from "@/lib/api/errors";
import { throwIfAIUsageExceeded } from "@/lib/api/links/usage-checks";
import { normalizeWorkspaceId } from "@/lib/api/workspace-id";
import { withWorkspace } from "@/lib/auth";
import z from "@/lib/zod";
import { anthropic } from "@ai-sdk/anthropic";
import { prismaEdge } from "@dub/prisma/edge";
import { waitUntil } from "@vercel/functions";
import { LangChainAdapter } from "ai";

const completionSchema = z.object({
  prompt: z.string(),
  model: z
    .enum(["claude-3-haiku-20240307", "claude-3-5-sonnet-latest"])
    .optional()
    .default("claude-3-5-sonnet-latest"),
});

// POST /api/ai/completion – Generate AI completion
export const POST = withWorkspace(async ({ req, workspace }) => {
  try {
    const {
      // comment for better diff
      prompt,
      model,
    } = completionSchema.parse(await req.json());

    throwIfAIUsageExceeded(workspace);

    const { stream } = await anthropic(model).doStream({
      prompt: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
      maxOutputTokens: 300,
    });

    const textStream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          if (chunk.type === "text-delta") {
            controller.enqueue(chunk.delta);
          }
        },
      }),
    );

    // only count usage for the sonnet model
    if (model === "claude-3-5-sonnet-latest") {
      waitUntil(
        prismaEdge.project.update({
          where: { id: normalizeWorkspaceId(workspace.id) },
          data: {
            aiUsage: {
              increment: 1,
            },
          },
        }),
      );
    }

    return LangChainAdapter.toDataStreamResponse(textStream);
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
});
