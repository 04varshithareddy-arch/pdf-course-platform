import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { quizId, answers } = await request.json();

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  let score = 0;
  const results = quiz.questions.map((q, i) => {
    const userAnswer = (answers[i] || "").trim().toLowerCase();
    const correct = (q.correctAnswer || "").trim().toLowerCase();
    const isCorrect = userAnswer === correct;
    if (isCorrect) score++;
    return { ...q, userAnswer: answers[i] || "", isCorrect };
  });

  await supabase.from("quiz_attempts").insert({
    user_id: userRow.id,
    quiz_id: quizId,
    score,
    total: quiz.questions.length,
    answers,
  });

  return NextResponse.json({ score, total: quiz.questions.length, results });
}