"use client";

import { useState } from "react";

export default function ChapterQuiz({ chapterId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const generateQuiz = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuiz(data.quiz);
        setAnswers({});
      }
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, answers }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      {!quiz && (
        <button
          onClick={generateQuiz}
          disabled={loading}
          className="bg-orange-500 text-white text-sm px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Generating quiz..." : "Take a Quiz on this Chapter"}
        </button>
      )}

      {quiz && !result && (
        <div className="space-y-5">
          <p className="font-semibold text-sm">Chapter Quiz</p>
          {quiz.questions.map((q, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium mb-2">{i + 1}. {q.question}</p>
              {q.type === "mcq" && (
                <div className="space-y-1">
                  {q.options.map((opt, j) => (
                    <label key={j} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-${i}`}
                        value={opt}
                        onChange={() => setAnswers({ ...answers, [i]: opt })}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "true_false" && (
                <div className="space-x-4">
                  {["True", "False"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name={`q-${i}`}
                        value={opt}
                        onChange={() => setAnswers({ ...answers, [i]: opt })}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "short_answer" && (
                <input
                  type="text"
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                  placeholder="Your answer"
                />
              )}
            </div>
          ))}
          <button
            onClick={submitQuiz}
            disabled={loading}
            className="bg-orange-500 text-white text-sm px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <p className="font-bold text-lg">Score: {result.score}/{result.total}</p>
          {result.results.map((r, i) => (
            <div
              key={i}
              className={`text-sm p-3 rounded ${r.isCorrect ? "bg-green-50" : "bg-red-50"}`}
            >
              <p className="font-medium">{i + 1}. {r.question}</p>
              <p>Your answer: {r.userAnswer || "(blank)"}</p>
              <p>Correct answer: {r.correctAnswer}</p>
              <p className="text-gray-600 mt-1">{r.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}