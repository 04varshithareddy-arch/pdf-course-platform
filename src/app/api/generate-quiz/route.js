import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { chapterId } = await request.json();

  const { data: existingQuiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("chapter_id", chapterId)
    .single();

  if (existingQuiz) {
    return NextResponse.json({ quiz: existingQuiz });
  }

  const { data: chapter } = await supabase
    .from("chapters")
    .select("*, lessons(*)")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const lessonText = chapter.lessons
    ?.map((l) => `${l.title}\n${l.content}`)
    .join("\n\n")
    .slice(0, 8000);

  const prompt = `Based on this chapter content, create a quiz with 5 questions: a mix of multiple choice, true/false, and short answer.

IMPORTANT: For multiple choice questions, correctAnswer must be the exact text of the correct option (matching one of the strings in "options" exactly), never just a letter like "A" or "B".

Return ONLY valid JSON (no markdown, no explanation) matching this structure:
{
  "questions": [
    {
      "type": "mcq",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "the exact text of the correct option, not a letter",
      "explanation": "..."
    },
    {
      "type": "true_false",
      "question": "...",
      "correctAnswer": "True",
      "explanation": "..."
    },
    {
      "type": "short_answer",
      "question": "...",
      "correctAnswer": "expected answer",
      "explanation": "..."
    }
  ]
}

Chapter: ${chapter.title}
Content:
${lessonText}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 3000,
  });

  let aiResponse = completion.choices[0].message.content.trim();
  aiResponse = aiResponse.replace(/^```json\n?/, "").replace(/```$/, "");
  const quizData = JSON.parse(aiResponse);

  const { data: savedQuiz, error } = await supabase
    .from("quizzes")
    .insert({ chapter_id: chapterId, questions: quizData.questions })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save quiz" }, { status: 500 });
  }

  return NextResponse.json({ quiz: savedQuiz });
}
