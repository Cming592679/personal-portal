// Minimal APIYI (API易) demo — OpenAI SDK repointed at api.apiyi.com
//
// Run (from the repo root, /home/cc/AI-project/personal-portal):
//   node --env-file=.env.local --experimental-strip-types src/lib/apiyi-demo.ts
//
// APIYI conventions used here:
//   - base URL is https://api.apiyi.com/v1 for the OpenAI SDK (SDK appends /chat/completions)
//   - model ID is dot-versioned and case-sensitive: gpt-5.4-mini
//   - key is read from APIYI_API_KEY, never hardcoded / never committed
//   - gpt-5.x: leave temperature at default (1), don't send top_p

import OpenAI from "openai";

const apiKey = process.env.APIYI_API_KEY;
if (!apiKey) {
  console.error("APIYI_API_KEY is not set. Copy it from https://api.apiyi.com/token");
  process.exit(1);
}

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.apiyi.com/v1",
});

const model = "gpt-5.4-mini";

const resp = await client.chat.completions.create({
  model,
  messages: [
    { role: "system", content: "你是一个简洁的助手。" },
    { role: "user", content: "用一句话介绍你自己，然后对我说一句中文的问候。" },
  ],
});

console.log("model:", resp.model);
console.log("content:", resp.choices[0]?.message?.content);
console.log("usage:", JSON.stringify(resp.usage, null, 2));
