import { NextResponse } from "next/server";
import supabase from "@/Backend/supabase";

export async function POST(request) {
  try {
    console.log("API Route hit: /api/request-case");
    const formData = await request.formData();
    console.log("FormData received");

    // Extract all form fields
    const caseData = {
      product_name: formData.get("product_name"),
      url: formData.get("url"),
      eol: formData.get("eol") === "true",
      width: parseFloat(formData.get("width")) || null,
      depth: parseFloat(formData.get("depth")) || null,
      gpu_height: parseFloat(formData.get("gpu_height")) || null,
      volume: parseFloat(formData.get("volume")) || null,
      mb_atx: formData.get("mb_atx") === "true",
      mb_matx: formData.get("mb_matx") === "true",
      mb_itx: formData.get("mb_itx") === "true",
      psu_atx: formData.get("psu_atx") === "true",
      psu_sfxl: formData.get("psu_sfxl") === "true",
      psu_sfx: formData.get("psu_sfx") === "true",
      psu_flex: formData.get("psu_flex") === "true",
      cpu_height: parseFloat(formData.get("cpu_height")) || null,
      l120: formData.get("l120") === "true",
      l140: formData.get("l140") === "true",
      l240: formData.get("l240") === "true",
      l280: formData.get("l280") === "true",
      l360: formData.get("l360") === "true",
      material: formData.get("material") || "Steel",
      release_year: formData.get("release_year") || null,
      status: "pending",
    };

    // Collect images and upload to storage
    const images = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image_") && value instanceof File) {
        images.push(value);
      }
    }

    // Upload images to storage and get URLs
    const imageUrls = [];
    if (images.length > 0) {
      const timestamp = Date.now();
      console.log(`Uploading ${images.length} images to storage`);

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const bytes = await image.arrayBuffer();

        // Create unique filename
        const fileExtension = image.type.split('/')[1] || 'png';
        const fileName = `pending_${timestamp}_${i + 1}.${fileExtension}`;
        const filePath = `case-requests/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('case-images')
          .upload(filePath, bytes, {
            contentType: image.type,
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading image ${i + 1}:`, uploadError);
          throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('case-images')
          .getPublicUrl(filePath);

        imageUrls.push(urlData.publicUrl);
        console.log(`Uploaded image ${i + 1} to:`, urlData.publicUrl);
      }
    }

    caseData.images = JSON.stringify(imageUrls);
    console.log(`Processed ${imageUrls.length} images`);
    console.log("Case data prepared:", { ...caseData, images: `${imageUrls.length} image URLs` });

    // Insert into case_requests table
    console.log("Inserting into Supabase...");
    const { data, error } = await supabase
      .from("case_requests")
      .insert([caseData])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Successfully inserted into database:", data);
    return NextResponse.json(
      { message: "Request submitted successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
