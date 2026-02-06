import { NextResponse } from "next/server";
import supabase from "@/Backend/supabase";
import { jwtVerify } from 'jose';

async function verifyAuth(request) {
  const token = request.cookies.get('admin-token')?.value;

  if (!token) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    // Verify authentication first
    const isAuthenticated = await verifyAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    // Update request status to rejected
    const { error } = await supabase
      .from("case_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Request rejected successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 }
    );
  }
}
