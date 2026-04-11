import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Batch-generates 1-line insights for all employees in one Gemini API call.
 * Safely cleans markdown fences before JSON.parse, with fallback on any error.
 */
export async function generateInsightsBatch(employees) {
  if (!employees || employees.length === 0) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an HR analytics assistant.

Analyze the following employees and return a single JSON array with exactly one object per employee.
Each object must have "name" and "insight" fields only.
The "insight" must be a single concise sentence (max 15 words) describing the employee's main risk.

IMPORTANT: Return ONLY raw JSON, no markdown, no code fences, no explanation.

Example response:
[{"name":"Alice","insight":"High burnout risk due to low task completion and frequent leaves."}]

Employees:
${employees.map(e =>
  `Name: ${e.name}, Risk Score: ${e.risk_score}, Productivity: ${(e.productivity * 100).toFixed(0)}%, Leave Ratio: ${(e.leave_ratio * 100).toFixed(0)}%, Attendance: ${(e.attendance_score * 100).toFixed(0)}%`
).join("\n")}
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate it's an array and normalize
    if (!Array.isArray(parsed)) throw new Error("Gemini did not return an array");

    return parsed.map(item => ({
      name: item.name || "",
      insight: item.insight || "Insight unavailable"
    }));

  } catch (err) {
    console.error("[GeminiService] Failed to generate insights:", err.message);
    // Fallback: generate rule-based insights
    return employees.map(e => ({
      name: e.name,
      insight: generateFallbackInsight(e)
    }));
  }
}

function generateFallbackInsight(emp) {
  if (emp.risk_level === "High") {
    if (emp.productivity < 0.4) return "Critical: very low productivity signals high burnout risk.";
    if (emp.leave_ratio > 0.25) return "Frequent absences indicate high disengagement or burnout.";
    return "Multiple risk factors detected — immediate HR attention recommended.";
  }
  if (emp.risk_level === "Medium") {
    if (emp.attendance_score < 0.8) return "Moderate attendance issues may affect team performance.";
    return "Moderate risk; monitor workload and engagement closely.";
  }
  return "Employee is performing within healthy parameters.";
}