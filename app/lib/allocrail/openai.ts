type StructuredCompletionArgs = {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  );

  return {
    apiKey,
    baseUrl,
    model: "gpt-4o-mini",
  };
}

export async function createStructuredCompletion<T>({
  system,
  user,
  schemaName,
  schema,
  maxTokens = 700,
}: StructuredCompletionArgs): Promise<T> {
  const config = getOpenAiConfig();
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: user,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema,
          },
        },
      }),
    });

    const payload = (await response.json()) as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message || "OpenAI request failed.");
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty structured response.");
    }

    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      if (/401|403|invalid api key/i.test(error.message)) {
        throw new Error("OpenAI API key is invalid or no longer authorized.");
      }
      if (/429|rate limit/i.test(error.message)) {
        throw new Error("OpenAI rate limit reached. Retry in a minute.");
      }
      if (/fetch failed|network|ECONNRESET|ETIMEDOUT/i.test(error.message)) {
        throw new Error("OpenAI request failed before completion. Retry shortly.");
      }
      throw error;
    }

    throw new Error("OpenAI request failed.");
  }
}
