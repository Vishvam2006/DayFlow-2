import OpenAI from "openai";

let client = null;

function getClient() {
  if (client) return client;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") return null;

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

  const openrouter = getClient();
  if (!openrouter) {
    console.warn(
      "⚠️ OPENROUTER_API_KEY missing; skipping AI insights generation.",
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

STRICT RULES:
- JSON must be parseable by JSON.parse()
- Use double quotes only
- No trailing commas
- No comments
- No explanation text
- Return ONLY the array

DATA ENFORCEMENT RULES:
- You MUST explicitly reference numeric values from the data in reasoning
- You MUST use at least 2 specific metrics per employee (e.g., "attendance dropped by 12%", "completion rate is 0.42")
- If two employees have different values, their insights MUST be different
- DO NOT generate generic summaries

CONTENT RULES:
- Use ONLY the provided employee data
- Do NOT invent facts
- Each employee must have unique reasoning

CATEGORY RULES:

- CRITICAL:
  Focus on fixing issues, strict monitoring, and intervention

- UNDERPERFORMING:
  Focus on coaching and improvement

- HIGH_PERFORMER:
  Focus on growth, promotion, and recognition

- AVERAGE:
  Focus on consistency

TREND ANALYSIS:
- MUST include at least one numeric delta (percentage or value)
- MUST explain WHY the trend is improving/stable/declining using the numbers
- Example: "Task completion dropped by 18% while attendance remained stable, indicating performance decline"

UNIQUENESS CONSTRAINT:
- Each employee insight MUST be clearly distinguishable from others
- If two outputs look similar, REWRITE them to be different

ANTI-TEMPLATE RULE:
- If you generate similar wording across employees, you MUST rewrite it using different reasoning and structure

BURNOUT:
- Based ONLY on:
  - attendance instability
  - drop in task completion or velocity
- Ignore approved leaves for high burnout

RECOMMENDATIONS:
- 3 to 5 items
- Must mention WHO (Manager or HR)
- Must be specific and actionable

MANAGER ACTION ITEMS:
- EXACTLY 2 or 3 items
- Must be imperative (e.g., "Schedule...", "Review...")
- Prefer time-bound actions

FINAL CHECK:
Before responding, ensure:
- Output is valid JSON
- No extra text
- No markdown

EMPLOYEES:
${employees
  .map(
    (e, i) => `
Employee ${i + 1}:
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
    if (!rawText) return [];

    const jsonText = extractFirstJsonArray(
      rawText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim(),
    );
    if (!jsonText) return [];

    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (err) {
    console.error("❌ Groq Error:", err.message);
    return [];
  }
}
