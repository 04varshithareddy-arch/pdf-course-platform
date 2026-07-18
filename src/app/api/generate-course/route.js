import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    // Fetch the document's extracted text
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Truncate text to keep prompt size manageable
    const textForAI = document.extracted_text.slice(0, 12000);

    const prompt = `You are an expert course creator. Based on the following document text, create a structured learning course.

Return ONLY valid JSON (no markdown, no code fences, no explanation) matching this exact structure:

{
  "title": "Course title",
  "description": "2-3 sentence course description",
  "difficulty_level": "Beginner" or "Intermediate" or "Advanced",
  "estimated_time": "e.g. 3 hours",
  "chapters": [
    {
      "title": "Chapter title",
      "lessons": [
        {
          "title": "Lesson title",
          "content": "Well-structured lesson explanation, 200-400 words",
          "key_takeaways": "2-3 bullet points as a single string separated by newlines"
        }
      ]
    }
  ]
}

Create 3-5 chapters, each with 2-4 lessons. Base everything strictly on the document content below.

DOCUMENT TEXT:
${textForAI}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 8000,
    });

    let aiResponse = completion.choices[0].message.content.trim();

    // Strip markdown code fences if the model added them anyway
    aiResponse = aiResponse.replace(/^```json\n?/, "").replace(/```$/, "");

    const courseData = JSON.parse(aiResponse);

    // Save the course
    const { data: savedCourse, error: courseError } = await supabase
      .from("courses")
      .insert({
        document_id: documentId,
        user_id: document.user_id,
        title: courseData.title,
        description: courseData.description,
        difficulty_level: courseData.difficulty_level,
        estimated_time: courseData.estimated_time,
      })
      .select()
      .single();

    if (courseError) {
      console.error("Course insert error:", courseError);
      return NextResponse.json({ error: "Failed to save course" }, { status: 500 });
    }

    // Save chapters and lessons
    for (let i = 0; i < courseData.chapters.length; i++) {
      const chapter = courseData.chapters[i];

      const { data: savedChapter, error: chapterError } = await supabase
        .from("chapters")
        .insert({
          course_id: savedCourse.id,
          title: chapter.title,
          order_index: i,
        })
        .select()
        .single();

      if (chapterError) {
        console.error("Chapter insert error:", chapterError);
        continue;
      }

      const lessonsToInsert = chapter.lessons.map((lesson, j) => ({
        chapter_id: savedChapter.id,
        title: lesson.title,
        content: lesson.content,
        key_takeaways: lesson.key_takeaways,
        order_index: j,
      }));

      await supabase.from("lessons").insert(lessonsToInsert);
    }

    return NextResponse.json({
      success: true,
      courseId: savedCourse.id,
      title: savedCourse.title,
    });
  } catch (error) {
    console.error("Course generation error:", error);
    return NextResponse.json({ error: "Failed to generate course: " + error.message }, { status: 500 });
  }
}
