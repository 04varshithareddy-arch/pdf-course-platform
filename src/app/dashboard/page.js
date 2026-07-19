import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";
import Link from "next/link";
import DashboardSearch from "./DashboardSearch";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your dashboard.</p>
      </main>
    );
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!userRow) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>User not found.</p>
      </main>
    );
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("*, chapters(id, title, lessons(id, title))")
    .eq("user_id", userRow.id)
    .order("created_at", { ascending: false });

  const { data: progressRows } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", userRow.id)
    .eq("completed", true);

  const completedIds = new Set(progressRows?.map((p) => p.lesson_id));

  const coursesWithStats = courses?.map((course) => {
    let total = 0;
    let completed = 0;
    course.chapters?.forEach((ch) => {
      ch.lessons?.forEach((l) => {
        total++;
        if (completedIds.has(l.id)) completed++;
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...course, total, completed, percent };
  });

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        Back to home
      </Link>

      <h1 className="text-3xl font-bold mt-4 mb-8">My Dashboard</h1>

      {(!coursesWithStats || coursesWithStats.length === 0) && (
        <p className="text-gray-500">
          No courses yet.{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Upload a PDF
          </Link>{" "}
          to generate your first course.
        </p>
      )}

      {coursesWithStats && coursesWithStats.length > 0 && (
        <DashboardSearch courses={coursesWithStats} />
      )}
    </main>
  );
}