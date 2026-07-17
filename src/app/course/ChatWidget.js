"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatWidget({ courseId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, message: userMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 h-96 bg-white text-black rounded-lg shadow-xl flex flex-col border border-gray-300">
          <div className="bg-purple-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <span className="font-semibold text-sm">Learning Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white text-lg leading-none">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.length === 0 && (
              <p className="text-gray-400 text-xs">Ask me anything about this course — I can explain concepts, summarize chapters, or quiz you.</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded max-w-[85%] whitespace-pre-line ${
                  m.role === "user" ? "bg-purple-100 ml-auto" : "bg-gray-100"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="bg-gray-100 p-2 rounded max-w-[85%] text-gray-400">Thinking...</div>}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-purple-600 text-white rounded-full w-14 h-14 shadow-lg text-2xl"
        >
          💬
        </button>
      )}
    </div>
  );
}