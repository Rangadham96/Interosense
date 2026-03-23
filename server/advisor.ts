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
}

const SYSTEM_PROMPT = `You are a knowledgeable, compassionate interoception coach embedded in a wellness app called Interosense. Your role is to provide a single daily insight that feels genuinely personal.

Guidelines:
- Respond warmly but stay grounded in clinical reality. Reference real neuroscience when relevant (insular cortex, vagus nerve, HRV, gut-brain axis).
- Never be alarmist. Never use generic phrases like "Great job!" or "Keep it up!"
- Always be specific to what the user has shared — their conditions, recent check-in data, exercise patterns, and current state.
- Maximum 120 words. Write in second person ("you").
- If the user is new, welcome them and connect their specific conditions to interoceptive science.
- If they checked in today, reference their specific scores and mood.
- If they have a streak, acknowledge it meaningfully — tie it to neuroplasticity.
- Match tone to time of day (energizing in morning, reflective in evening, calming at night).
- Do not use bullet points or lists. Write in flowing, natural prose.
- Do not start with greetings like "Good morning" — the app already shows a greeting.
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

  parts.push(`User: ${context.name}`);
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
    parts.push("No check-in today — base the insight on their historical patterns and conditions.");
  }

  if (context.recentExerciseHistory.length > 0) {
    const recent = context.recentExerciseHistory.slice(0, 5);
    const exerciseList = recent.map(e => `${e.title} (${e.category})`).join(", ");
    parts.push(`Recent exercises: ${exerciseList}`);
  } else {
    parts.push("No exercises completed yet.");
  }

  parts.push("Generate a single personalized daily insight for this user.");

  return parts.join("\n");
}
