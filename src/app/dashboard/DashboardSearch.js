"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function DashboardSearch({ courses }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return courses;
    const q = query.toLowerCase();

    return courses.filter((course) => {
      if (course.title?.toLowerCase().includes(q)) return true;
      if (course.description?.toLowerCase().includes(q)) return true;

      return course.chapters?.some((ch) => {
        if (ch.title?.toLowerCase().includes(q)) return true;
        return ch.lessons?.some((l) => l.title?.toLowerCase().includes(q));
      });
    });
  }, [query, courses]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search courses, chapters, lessons..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:border-blue-400"
      />

      {filtered.length === 0 && (
        <p className="text-gray-500">No results match "{query}".</p>
      )}

      <div className="space-y-4">
        {filtered.map((course) => (
          <Link
            key={course.id}
            href={`/course/${course.id}`}
            className="block border border-gray-300 rounded-lg p-5 hover:border-blue-400 transition"
          >
            <h2 className="text-lg font-semibold mb-1">{course.title}</h2>
            <p className="text-sm text-gray-500 mb-3">{course.description}</p>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
              <span>📊 {course.difficulty_level}</span>
              <span>📚 {course.total} lessons</span>
              <span>{course.completed}/{course.total} completed</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${course.percent}%` }}
              ></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}