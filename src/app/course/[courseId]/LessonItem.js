"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LessonItem({ lesson, index, initialCompleted }) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const toggleComplete = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, completed: !completed }),
      });
      if (res.ok) {
        setCompleted(!completed);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`border-l-4 pl-4 ${completed ? "border-green-400" : "border-blue-400"}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium mb-1">
          {index + 1}. {lesson.title}
        </h3>
        <button
          onClick={toggleComplete}
          disabled={saving}
          className={`shrink-0 text-xs px-3 py-1 rounded ${
            completed
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700"
          } disabled:opacity-50`}
        >
          {completed ? "Completed" : "Mark complete"}
        </button>
      </div>
      <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{lesson.content}</p>
      {lesson.key_takeaways && (
        <div className="bg-yellow-50 text-black text-sm p-3 rounded mt-2">
          <p className="font-semibold mb-1">Key Takeaways:</p>
          <p className="whitespace-pre-line">{lesson.key_takeaways}</p>
        </div>
      )}
    </div>
  );
}