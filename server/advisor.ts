interface UserContext {
  name: string;
  conditions: string[];
  todayCheckin: {
    awarenessScore: number;
    energyLevel: number;
    sleepQuality: number;
    stressLevel: number;
    mood: string;
  } | null;
  recentExerciseHistory: { title: string; category: string; completedAt: string }[];
  currentStreak: number;
  totalSessions: number;
  totalMinutes: number;
  timeOfDay: string;
  isNewUser: boolean;
  wearableContext?: {
    avgHrv?: number;
    lastSleepHours?: number;
    avgSleep7d?: number;
    avgHrv7d?: number;
  } | null;
}

const SYSTEM_PROMPT = `You are a careful, compassionate interoception coach embedded in a wellness app called Interosense. Provide one brief reflection and one low-risk practice suggestion based only on the information supplied.

Guidelines:
- This is wellness guidance, not medical care. Do not diagnose, assess risk, prescribe treatment, or tell the user what a symptom or biometric means medically.
- Do not claim that a practice changed cortisol, vagal tone, brain structure, inflammation, neurotransmitters, or any other unmeasured biological process.
- Treat wearable data as variable context, not a verdict about nervous-system regulation. Never apply universal HRV cutoffs. If mentioning a number, describe only its direction relative to that user's supplied baseline and acknowledge that many factors can affect it.
- Do not make causal claims from sleep, streaks, conditions, or exercise history. Do not use neuroscience terminology merely to sound authoritative.
- Never be alarmist. Never use generic phrases like "Great job!" or "Keep it up!"
- Be specific to the supplied check-in, recent practice, and current state while using tentative language such as "may", "could", and "consider".
- Maximum 120 words. Write in second person ("you").
- If the user is new, explain the Notice, Describe, Connect approach without promising an outcome.
- If they checked in today, reference their specific scores and mood.
- If they have a streak, acknowledge the consistency without claiming neuroplastic or clinical change.
- If real HRV or sleep data is available, use it only as optional context and avoid interpreting a single reading.
- Recommend only gentle practices already represented in the supplied exercise history or a simple pause to notice and describe sensations. If the context suggests severe distress, encourage contacting a qualified professional or local emergency/crisis support rather than offering an exercise as treatment.
- Match tone to time of day (energizing in morning, reflective in evening, calming at night).
- Do not use bullet points or lists. Write in flowing, natural prose.
- Do not start with greetings like "Good morning", the app already shows a greeting.
- Do not mention that you are an AI.`;

export async function generateInsight(context: UserContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const userMessage = buildUserMessage(context);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    content: { type: string; text: string }[];
  };

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Claude API");
  }

  return text.trim();
}

function buildUserMessage(context: UserContext): string {
  const parts: string[] = [];

  parts.push(`Time of day: ${context.timeOfDay}`);

  if (context.isNewUser) {
    parts.push("This is a brand new user who just signed up.");
  }

  if (context.conditions.length > 0) {
    parts.push(`Conditions they are working on: ${context.conditions.join(", ")}`);
  }

  parts.push(`Practice stats: ${context.totalSessions} total sessions, ${context.totalMinutes} total minutes, ${context.currentStreak}-day streak`);

  if (context.todayCheckin) {
    const c = context.todayCheckin;
    parts.push(`Today's check-in: awareness ${c.awarenessScore}/10, energy ${c.energyLevel}/10, sleep quality ${c.sleepQuality}/10, stress ${c.stressLevel}/10, mood: ${c.mood || "not specified"}`);
  } else {
    parts.push("No check-in today, base the insight on their historical patterns and conditions.");
  }

  if (context.recentExerciseHistory.length > 0) {
    const recent = context.recentExerciseHistory.slice(0, 5);
    const exerciseList = recent.map(e => `${e.title} (${e.category})`).join(", ");
    parts.push(`Recent exercises: ${exerciseList}`);
  } else {
    parts.push("No exercises completed yet.");
  }

  if (context.wearableContext) {
    const w = context.wearableContext;
    const wearableParts: string[] = [];
    if (w.avgHrv !== undefined && w.avgHrv7d !== undefined && w.avgHrv7d > 0) {
      const hrvRatio = w.avgHrv / w.avgHrv7d;
      const hrvDirection = hrvRatio > 1.1 ? "higher than" : hrvRatio < 0.9 ? "lower than" : "similar to";
      wearableParts.push(`recent HRV is ${hrvDirection} the user's 7-day average`);
    }
    if (w.lastSleepHours !== undefined && w.avgSleep7d !== undefined) {
      const sleepDifference = w.lastSleepHours - w.avgSleep7d;
      const sleepDirection = sleepDifference > 0.75 ? "longer than" : sleepDifference < -0.75 ? "shorter than" : "similar to";
      wearableParts.push(`last night's sleep duration was ${sleepDirection} the user's 7-day average`);
    }
    if (wearableParts.length > 0) {
      parts.push(`Optional qualitative wearable context. Do not infer health status or repeat biometric numbers: ${wearableParts.join(", ")}`);
    }
  }

  parts.push("Generate a single personalized daily insight for this user.");

  return parts.join("\n");
}
