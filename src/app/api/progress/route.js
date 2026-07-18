import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

export async function POST(request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { lessonId, completed } = await request.json();

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("progress")
    .select("id")
    .eq("user_id", userRow.id)
    .eq("lesson_id", lessonId)
    .single();

  if (existing) {
    await supabase
      .from("progress")
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", existing.id);
  } else {
    await supabase.from("progress").insert({
      user_id: userRow.id,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
  }

  return NextResponse.json({ success: true });
}
