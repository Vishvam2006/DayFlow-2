let client = null;
let openAIConstructorPromise = null;

async function loadOpenAIConstructor() {
  if (!openAIConstructorPromise) {
    openAIConstructorPromise = import("openai")
      .then((module) => module.default)
      .catch((error) => {
        if (
          error?.code === "ERR_MODULE_NOT_FOUND" ||
          error?.message?.includes("Cannot find package 'openai'")
        ) {
          console.warn(
            "⚠️ openai package is not installed; skipping AI insights generation.",
          );
          return null;
        }

        throw error;
      });
  }

  return openAIConstructorPromise;
}

async function getClient() {
  if (client) return client;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") return null;

  const OpenAI = await loadOpenAIConstructor();
  if (!OpenAI) return null;

  client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  return client;
}

function extractFirstJsonArray(text) {
  const start = text.indexOf("[");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "[") depth++;
    if (ch === "]") depth--;

    if (depth === 0) return text.slice(start, i + 1);
  }

  return null;
}

export async function generateInsightsBatch(employees) {
  if (!Array.isArray(employees) || employees.length === 0) return [];

  const openrouter = await getClient();
  if (!openrouter) {
    console.warn(
      "⚠️ AI insights client unavailable; skipping AI insights generation.",
    );
    return [];
  }

  const prompt = `
You are a predictive HR analyst and performance coach.

IMPORTANT:
You MUST return ONLY valid JSON.
Do NOT include any text before or after JSON.
Do NOT use markdown or code blocks.

OUTPUT FORMAT:
Return a JSON array. Each item MUST follow:

{
  "employeeId": string,
  "name": string,
  "insight": {
    "summary": string,
    "trend_analysis": string,
    "burnout_risk_indicator": "Low" | "Medium" | "High",
    "issues": string[],
    "impact": string,
    "recommendations": string[],
    "manager_action_items": string[]
  }
}

STRICT JSON RULES:
- Must be parseable by JSON.parse()
- Use double quotes only
- No trailing commas
- No comments
- No explanation text
- Return ONLY the array

🚨 CRITICAL DIFFERENTIATION RULE (HIGHEST PRIORITY):
- EVERY employee MUST have COMPLETELY DIFFERENT output
- If ANY two employees have different numeric values → outputs MUST differ significantly
- You MUST NOT reuse:
  - same sentences
  - same recommendation patterns
  - same phrasing structure
- If outputs look similar → REWRITE them completely

🚨 HARD ANTI-TEMPLATE RULE:
- You are STRICTLY FORBIDDEN from generating generic or reusable templates
- DO NOT repeat:
  "review weekly blockers"
  "monitor attendance"
  "set goals"
  or similar patterns across employees
- Each employee must feel like a completely different case analysis

🚨 NUMERIC GROUNDING RULE:
- Each employee MUST reference at least 2–3 numeric values:
  (attendance %, completion rate, velocity, deltas)
- MUST explicitly include numbers in reasoning:
  Example:
  "attendance dropped by 18.5%"
  "completion rate is 0.42 vs 0.71 baseline"

🚨 OUTPUT DIVERSITY RULE:
- Vary sentence structure across employees
- Vary tone (analytical, risk-focused, growth-focused)
- Vary recommendation style (short, tactical, strategic)
- Avoid repeating same verbs or phrasing

CONTENT RULES:
- Use ONLY provided data
- Do NOT invent facts
- Each employee must have unique reasoning

CATEGORY RULES:

CRITICAL:
- Focus on urgent intervention, correction, performance recovery

UNDERPERFORMING:
- Focus on coaching, structured improvement, monitoring

HIGH_PERFORMER:
- Focus on growth, leadership, retention, recognition

AVERAGE:
- Focus on consistency, optimization, incremental improvement

TREND ANALYSIS:
- MUST include numeric delta
- MUST explain WHY trend is improving/stable/declining

BURNOUT RULES:
- Based ONLY on:
  - attendance instability
  - drop in completion or velocity
- Ignore approved leave for burnout

RECOMMENDATIONS:
- 3 to 5 items
- Must include WHO (Manager or HR)
- Must be specific and DIFFERENT across employees
- Avoid repeating recommendation patterns

MANAGER ACTION ITEMS:
- EXACTLY 2 or 3 items
- Must be imperative
- Must be time-bound when possible
- MUST differ across employees

🚨 FINAL VALIDATION BEFORE OUTPUT:
- Ensure NO two employees have similar wording
- Ensure each employee references different numbers
- Ensure recommendations are NOT reused
- If similarity exists → REWRITE

EMPLOYEES:
${employees
  .map(
    (e, i) => `
Employee ${i + 1}:
Employee ID: ${e.employeeId}
Name: ${e.name}
Department: ${e.department}
Role: ${e.jobTitle}
Category: ${e.category}

Performance Score: ${Number(e.performance_score ?? 0)}
Risk Score: ${Number(e.risk_score ?? 0)}
Risk Level: ${e.risk_level}

30-Day Metrics:
Attendance Rate: ${Number(e.window?.attendanceRate ?? 0).toFixed(3)}
Tasks Assigned: ${Number(e.window?.tasksAssigned ?? 0)}
Tasks Completed: ${Number(e.window?.tasksCompleted ?? 0)}
Completion Rate: ${Number(e.window?.taskCompletionRate ?? 0).toFixed(3)}
Velocity/week: ${Number(e.window?.taskVelocityPerWeek ?? 0).toFixed(2)}

Baseline (90-Day):
Attendance Rate: ${Number(e.baseline?.attendanceRate ?? 0).toFixed(3)}
Completion Rate: ${Number(e.baseline?.taskCompletionRate ?? 0).toFixed(3)}
Velocity/week: ${Number(e.baseline?.taskVelocityPerWeek ?? 0).toFixed(2)}

Deltas:
Attendance Δ%: ${(Number(e.deltas?.attendanceRate ?? 0) * 100).toFixed(1)}
Completion Δ%: ${(Number(e.deltas?.taskCompletionRate ?? 0) * 100).toFixed(1)}
Velocity Δ%: ${(Number(e.deltas?.taskVelocityPerWeek ?? 0) * 100).toFixed(1)}
`,
  )
  .join("\n")}
`;

  try {
    const response = await openrouter.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a predictive HR analyst. You must output ONLY strict JSON. No markdown. No extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const rawText = response.choices[0]?.message?.content;
    console.log("🔥 RAW AI RESPONSE:\n", rawText);
    if (!rawText) return [];

    const jsonText = extractFirstJsonArray(
      rawText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim(),
    );
    if (!jsonText) {
      console.log("❌ JSON extraction failed");
      console.log(rawText);
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.log("❌ JSON PARSE ERROR:", e.message);
      console.log(jsonText);
      return [];
    }
    console.log("✅ PARSED AI OUTPUT:", parsed);

    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (err) {
    console.error("❌ OpenRouter Error:", err.message);
    return [];
  }
}
