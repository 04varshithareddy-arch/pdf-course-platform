import { NextResponse } from "next/server";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { auth } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);

    // Find or create the user in our own "users" table, based on their email
    let { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    let userId;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        })
        .select()
        .single();

      if (userError) {
        console.error("User creation error:", userError);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      userId = newUser.id;
    }

    // Save the document, linked to the real user
    const { data: savedDocument, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        filename: file.name,
        extracted_text: data.text,
        page_count: data.numpages,
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      documentId: savedDocument.id,
      filename: savedDocument.filename,
      pages: savedDocument.page_count,
      textPreview: data.text.slice(0, 500),
    });
  } catch (error) {
    console.error("PDF parsing error:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}
