import Groq from "groq-sdk";

let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") return null;
  groqClient = new Groq({ apiKey });
  return groqClient;
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

  const groq = getGroqClient();
  if (!groq) {
    console.warn("⚠️ GROQ_API_KEY missing; skipping AI insights generation.");
    return [];
  }

  const prompt = `
You are a predictive HR analyst and performance coach.

CRITICAL OUTPUT RULES (MUST FOLLOW):
- Output ONLY valid JSON
- Output MUST be directly parseable by JSON.parse()
- Use DOUBLE QUOTES for ALL keys and strings
- Do NOT use single quotes
- Do NOT add trailing commas
- Do NOT add comments
- Do NOT add explanation or text outside JSON
- Do NOT wrap in Markdown code fences

STRUCTURE:
Return a JSON array where each object has:
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

CONTENT RULES:
- Use ONLY provided data (30-day window vs 90-day baseline, performance & risk)
- Do NOT invent facts that are not implied by the data.
- Each employee MUST have unique reasoning
- Avoid repetition across employees

TREND RULES:
- "trend_analysis" must be 1-2 sentences describing trajectory (improving/stable/declining) and citing the strongest deltas (attendance/completion/velocity).
- If the baseline is near-zero or data is sparse, explicitly say the trend confidence is low.

BURNOUT RULES:
- "burnout_risk_indicator" must be Low/Medium/High using ONLY:
  - Unusual attendance instability vs baseline (excluding approved leave days)
  - Dropping task velocity and/or completion rate vs baseline
- Do NOT classify High purely due to approved Sick leave. Prefer task/attendance instability signals.

RECOMMENDATIONS RULES:
- 3 to 5 recommendations per employee
- Each must be actionable and specific
- Must clearly mention WHO performs action (Manager or HR)
- Prefer measurable or time-bound actions

MANAGER ACTION ITEMS RULES:
- Provide exactly 2 to 3 items in "manager_action_items"
- Each item must be a specific manager action, phrased as an imperative, with a timebox when possible.
- Avoid generic advice; tie each to the strongest signal (trend, attendance instability, or velocity change).

STRICTLY AVOID:
- generic phrases
- repeated wording
- template copying

EMPLOYEES:
${employees.map((e, i) =>
  `Employee ${i + 1}:
  Name: ${e.name}
  Department: ${e.department}
  Role: ${e.jobTitle}
  Performance Score (0-100): ${Number(e.performance_score ?? 0)}
  Risk Score (0-100): ${Number(e.risk_score ?? 0)}
  Risk Level: ${e.risk_level}

  30-Day Window Metrics:
  - Attendance Rate (0-1): ${Number(e.window?.attendanceRate ?? 0).toFixed(3)}
  - Attendance Denominator Days: ${Number(e.window?.attendanceDenominatorDays ?? 0)}
  - Avg Work Hours (approx): ${Number(e.window?.avgWorkHours ?? 0).toFixed(2)}
  - Tasks Assigned: ${Number(e.window?.tasksAssigned ?? 0)}
  - Tasks Completed: ${Number(e.window?.tasksCompleted ?? 0)}
  - Task Completion Rate (0-1): ${Number(e.window?.taskCompletionRate ?? 0).toFixed(3)}
  - Task Velocity per Week: ${Number(e.window?.taskVelocityPerWeek ?? 0).toFixed(2)}
  - Approved Leave Days: ${Number(e.window?.leaveDaysApproved ?? 0)}
  - Excused (Sick) Leave Days: ${Number(e.window?.excusedLeaveDays ?? 0)}
  - Non-Excused Leave Days: ${Number(e.window?.nonExcusedLeaveDays ?? 0)}

  90-Day Baseline Metrics (prior period):
  - Attendance Rate (0-1): ${Number(e.baseline?.attendanceRate ?? 0).toFixed(3)}
  - Task Completion Rate (0-1): ${Number(e.baseline?.taskCompletionRate ?? 0).toFixed(3)}
  - Task Velocity per Week: ${Number(e.baseline?.taskVelocityPerWeek ?? 0).toFixed(2)}

  Deltas (window vs baseline):
  - Attendance Rate Delta (%): ${(Number(e.deltas?.attendanceRate ?? 0) * 100).toFixed(1)}
  - Task Completion Rate Delta (%): ${(Number(e.deltas?.taskCompletionRate ?? 0) * 100).toFixed(1)}
  - Task Velocity Delta (%): ${(Number(e.deltas?.taskVelocityPerWeek ?? 0) * 100).toFixed(1)}
`
).join("\n\n")}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a predictive HR analyst. You must output ONLY strict JSON. No markdown. No extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
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
