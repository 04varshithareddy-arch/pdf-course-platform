import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { courseId, message } = await request.json();

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("*, documents(extracted_text)")
    .eq("id", courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const contextText = course.documents?.extracted_text?.slice(0, 8000) || "";

  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", userRow.id)
    .eq("course_id", courseId)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = [
    {
      role: "system",
      content: `You are a helpful learning assistant for the course "${course.title}". Answer questions based on this source material, explain concepts clearly, and help the learner understand the topic. If asked to summarize, quiz, or suggest next steps, do so helpfully. Source material:\n\n${contextText}`,
    },
    ...(history || []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    max_tokens: 1000,
  });

  const reply = completion.choices[0].message.content;

  await supabase.from("chat_messages").insert([
    { user_id: userRow.id, course_id: courseId, role: "user", content: message },
    { user_id: userRow.id, course_id: courseId, role: "assistant", content: reply },
  ]);

  return NextResponse.json({ reply });
}