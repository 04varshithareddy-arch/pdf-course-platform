import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";
import Link from "next/link";
import LessonItem from "./LessonItem";
import ChatWidget from "../ChatWidget";
import ChapterQuiz from "../ChapterQuiz";

export default async function CoursePage({ params }) {
  const { courseId } = await params;
  const session = await auth();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Course not found.</p>
      </main>
    );
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  chapters?.forEach((chapter) => {
    chapter.lessons?.sort((a, b) => a.order_index - b.order_index);
  });

  let completedLessonIds = new Set();
  let totalLessons = 0;
  chapters?.forEach((c) => (totalLessons += c.lessons?.length || 0));

  if (session?.user) {
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userRow) {
      const { data: progressRows } = await supabase
        .from("progress")
        .select("lesson_id, completed")
        .eq("user_id", userRow.id)
        .eq("completed", true);

      progressRows?.forEach((p) => completedLessonIds.add(p.lesson_id));
    }
  }

  let courseCompletedCount = 0;
  chapters?.forEach((c) => {
    c.lessons?.forEach((l) => {
      if (completedLessonIds.has(l.id)) courseCompletedCount++;
    });
  });
  const percent = totalLessons > 0 ? Math.round((courseCompletedCount / totalLessons) * 100) : 0;

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        ? Back to home
      </Link>

      <h1 className="text-3xl font-bold mt-4 mb-2">{course.title}</h1>
      <p className="text-gray-600 mb-4">{course.description}</p>

      <div className="flex gap-4 text-sm text-gray-500 mb-4">
        <span>?? {course.difficulty_level}</span>
        <span>?? {course.estimated_time}</span>
        <span>?? {chapters?.length || 0} chapters</span>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{percent}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-8">
        {chapters?.map((chapter, i) => (
          <div key={chapter.id} className="border border-gray-300 rounded-lg p-5">
            <h2 className="text-xl font-semibold mb-4">
              Chapter {i + 1}: {chapter.title}
            </h2>

            <div className="space-y-4">
              {chapter.lessons?.map((lesson, j) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  index={j}
                  initialCompleted={completedLessonIds.has(lesson.id)}
                />
              ))}
            </div>

            <ChapterQuiz chapterId={chapter.id} />
          </div>
        ))}
      </div>

      <ChatWidget courseId={courseId} />
    </main>
  );
}
