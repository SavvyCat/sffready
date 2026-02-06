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
    console.log("Approving case with ID:", id);

    // Get the request details
    const { data: caseRequest, error: fetchError } = await supabase
      .from("case_requests")
      .select("*")
      .eq("id", id)
      .single();

    console.log("Fetched case request:", caseRequest);

    if (fetchError || !caseRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Get the highest image_id from CASES table
    const { data: maxIdData } = await supabase
      .from("CASES")
      .select("image_id")
      .order("image_id", { ascending: false })
      .limit(1);

    const nextImageId = maxIdData && maxIdData.length > 0
      ? parseInt(maxIdData[0].image_id) + 1
      : 1;

    // Move images from pending to approved folder
    let approvedImageUrls = [];
    if (caseRequest.images) {
      try {
        const imageUrls = JSON.parse(caseRequest.images);
        console.log(`Moving ${imageUrls.length} images to approved folder`);

        for (let i = 0; i < imageUrls.length; i++) {
          const url = imageUrls[i];

          // Extract the file path from the URL
          // URL format: https://.../storage/v1/object/public/case-images/case-requests/pending_123_1.png
          const urlParts = url.split('/case-images/');
          if (urlParts.length !== 2) {
            console.error('Invalid image URL format:', url);
            continue;
          }

          const oldPath = urlParts[1]; // e.g., "case-requests/pending_123_1.png"
          const fileExtension = oldPath.split('.').pop();
          const newFileName = `${nextImageId}_${i + 1}.${fileExtension}`;
          const newPath = `cases/${newFileName}`;

          // Move the file in storage
          const { error: moveError } = await supabase.storage
            .from('case-images')
            .move(oldPath, newPath);

          if (moveError) {
            console.error(`Error moving image ${i + 1}:`, moveError);
            // If move fails, try to keep the old URL
            approvedImageUrls.push(url);
          } else {
            // Get new public URL
            const { data: urlData } = supabase.storage
              .from('case-images')
              .getPublicUrl(newPath);

            approvedImageUrls.push(urlData.publicUrl);
            console.log(`Moved image ${i + 1} to:`, urlData.publicUrl);
          }
        }
      } catch (error) {
        console.error("Error processing images:", error);
        return NextResponse.json(
          { error: "Failed to process images: " + error.message },
          { status: 500 }
        );
      }
    }

    // Prepare data for CASES table (matching your existing simple structure)
    // Calculate gpu_thickness from slots (typically ~20mm per slot)
    const gpuThickness = caseRequest.slots ? Math.round(caseRequest.slots * 20) : null;

    const caseData = {
      product_name: caseRequest.product_name,
      url: caseRequest.url,
      length: caseRequest.length,
      height: caseRequest.height,
      "gpu_thickness_(mm)": gpuThickness, // Calculate thickness from slots
      slots: caseRequest.slots, // Keep slots as separate field
      image_id: nextImageId.toString(),
      image_urls: approvedImageUrls.length > 0 ? JSON.stringify(approvedImageUrls) : null, // Store image URLs
    };

    // Insert into CASES table
    console.log("Inserting into CASES:", caseData);
    const { error: insertError } = await supabase
      .from("CASES")
      .insert([caseData]);

    if (insertError) {
      console.error("Error inserting case:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
    console.log("Successfully inserted into CASES with approved images:", approvedImageUrls);

    // Update request status to approved
    // The detailed specs remain in case_requests table with status="approved"
    console.log("Updating case_requests status to approved for ID:", id);
    const { data: updateData, error: updateError } = await supabase
      .from("case_requests")
      .update({
        status: "approved",
        image_id: nextImageId.toString() // Link back to CASES table
      })
      .eq("id", id)
      .select();

    console.log("Update result:", { updateData, updateError });

    if (updateError) {
      console.error("Error updating request status:", updateError);
      return NextResponse.json(
        { error: "Failed to update request status: " + updateError.message },
        { status: 500 }
      );
    }

    if (!updateData || updateData.length === 0) {
      console.error("No rows were updated! ID might not exist:", id);
      return NextResponse.json(
        { error: "Failed to update request - ID not found" },
        { status: 404 }
      );
    }

    console.log("Successfully updated status to approved");

    return NextResponse.json(
      {
        message: "Case approved and added to database",
        imageId: nextImageId,
        note: "Basic info added to CASES table. Detailed specs remain in case_requests (status=approved)"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving case:", error);
    return NextResponse.json(
      { error: "Failed to approve case" },
      { status: 500 }
    );
  }
}
