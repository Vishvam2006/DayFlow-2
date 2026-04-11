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
You are a Senior Industrial Psychologist and HR Data Scientist.

Return ONLY a JSON array.
Each object must have:
- name
- insight as an object with summary, issues, impact, recommendations

Do not add markdown or explanation.

Employees:
${employees.map(e =>
  `User: ${e.name} | Productivity: ${(e.productivity * 100).toFixed(0)}% | Leave: ${(e.leave_ratio * 100).toFixed(0)}% | Attendance: ${(e.attendance_score * 100).toFixed(0)}% | Risk: ${e.risk_score}`
).join("\n")}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Output strictly valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText) return [];

    const jsonText = extractFirstJsonArray(rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
    if (!jsonText) return [];

    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (err) {
    console.error("❌ Groq Error:", err.message);
    return [];
  }
}