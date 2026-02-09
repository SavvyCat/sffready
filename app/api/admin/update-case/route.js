import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import supabase from "@/Backend/supabase";

async function verifyAuth(request) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing case ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("case_requests")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Case updated successfully", data });
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Failed to update case", details: error.message },
      { status: 500 }
    );
  }
}
