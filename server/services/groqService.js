import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

  const prompt = `
You are a strict JSON generator and senior HR strategist.

CRITICAL OUTPUT RULES (MUST FOLLOW):
- Output ONLY valid JSON
- Output MUST be directly parseable by JSON.parse()
- Use DOUBLE QUOTES for ALL keys and strings
- Do NOT use single quotes
- Do NOT add trailing commas
- Do NOT add comments
- Do NOT add explanation or text outside JSON

STRUCTURE:
Return a JSON array where each object has:
{
  "name": string,
  "insight": {
    "summary": string,
    "issues": string[],
    "impact": string,
    "recommendations": string[]
  }
}

CONTENT RULES:
- Use ONLY provided data (productivity, leave, attendance, risk)
- Each employee MUST have unique reasoning
- Avoid repetition across employees

RECOMMENDATIONS RULES:
- 3 to 5 recommendations per employee
- Each must be actionable and specific
- Must clearly mention WHO performs action (Manager or HR)
- Prefer measurable or time-bound actions

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
  Productivity: ${(e.productivity * 100).toFixed(0)}%
  Leave: ${(e.leave_ratio * 100).toFixed(0)}%
  Attendance: ${(e.attendance_score * 100).toFixed(0)}%
  Risk Score: ${e.risk_score}`
).join("\n\n")}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Output strictly valid JSON only." },
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
