"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [courseResult, setCourseResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setCourseResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a PDF first");
      return;
    }

    setUploading(true);
    setResult(null);
    setCourseResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCourse = async () => {
    if (!result?.documentId) return;

    setGenerating(true);
    setCourseResult(null);

    try {
      const res = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: result.documentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Course generation failed");
      }

      setCourseResult(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">
        PDF to E-Course Platform
      </h1>

      {status === "loading" && (
        <p className="text-gray-500 mb-4">Loading...</p>
      )}

      {status === "unauthenticated" && (
        <button
          onClick={() => signIn("google")}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 mb-8"
        >
          Sign in with Google
        </button>
      )}

      {status === "authenticated" && (
        <div className="mb-8 text-center">
          <p className="mb-2">
            Signed in as {session.user.email}
          </p>

          <button
            onClick={() => signOut()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Sign out
          </button>
          <a href="/dashboard" className="ml-3 inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Dashboard</a>
        </div>
      )}

      {status === "authenticated" && (
        <>
          <p className="text-gray-500 mb-8">
            Upload a PDF to generate a learning course
          </p>

          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="border border-gray-300 rounded p-2 mb-4"
          />

          {file && (
            <p className="text-sm text-green-500 mb-4">
              Selected: {file.name}
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>

          {result && (
            <div className="mt-8 max-w-xl border border-gray-300 rounded p-4">
              <p className="font-bold">
                Upload successful!
              </p>

              <p>Filename: {result.filename}</p>
              <p>Pages: {result.pages}</p>

              <button
                onClick={handleGenerateCourse}
                disabled={generating}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {generating
                  ? "Generating course... (this may take 30-60s)"
                  : "Generate Course"}
              </button>
            </div>
          )}

          {courseResult && (
            <div className="mt-6 max-w-xl border border-purple-400 rounded p-4 bg-purple-50 text-black">
              <p className="font-bold">
                Course generated!
              </p>

              <p className="mb-3">
                <strong>Title:</strong> {courseResult.title}
              </p>

              <Link
                href={`/course/${courseResult.courseId}`}
                className="inline-block mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                View Course â†’
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}