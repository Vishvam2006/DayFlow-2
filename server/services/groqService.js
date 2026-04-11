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
You are an expert HR strategist and organizational psychologist.

Your task is to analyze employee data and produce precise, actionable insights.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array
- No explanations, no markdown, no extra text
- Do not include any text outside JSON
- Ensure all employees have DIFFERENT outputs

OUTPUT STRUCTURE:
[
  {
    "name": "Employee Name",
    "insight": {
      "summary": "Concise diagnosis of employee situation",
      "issues": ["issue 1", "issue 2"],
      "impact": "clear business or team impact",
      "recommendations": [
        "specific action with responsible person",
        "specific measurable intervention",
        "targeted corrective step",
        "optional additional concrete action"
      ]
    }
  }
]

ANALYSIS INSTRUCTIONS:
- Use ONLY the provided data
- Identify root causes based on patterns in:
  productivity, leave, attendance, and risk
- Do not repeat the same reasoning across employees
- Each employee must be analyzed independently

RECOMMENDATION CONSTRAINTS:
- Each recommendation must be actionable and specific
- Include who should act (manager or HR)
- Include what action should be taken
- Include time-bound or measurable elements where possible
- Avoid vague or generic language
- Avoid repeating similar recommendations across employees

DIVERSITY RULE:
- If two employees have similar metrics, still generate different insights and actions by varying interpretation and intervention strategy

EMPLOYEE DATA:
${employees
  .map(
    (e) =>
      `Name: ${e.name}, Department: ${e.department}, Role: ${e.jobTitle}, Productivity: ${(e.productivity * 100).toFixed(0)}%, Leave: ${(e.leave_ratio * 100).toFixed(0)}%, Attendance: ${(e.attendance_score * 100).toFixed(0)}%, Risk: ${e.risk_score}`,
  )
  .join("\n")}
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
