import supabase from "../supabase";

export default async function getFilteredCases(gpuLength, gpuHeight, gpuSlots) {
  let { data: CASES, error } = await supabase
    .from("CASES")
    .select("*")
    .gte("length", gpuLength)
    .gte("height", gpuHeight)
    .gte("slots", gpuSlots)
    .order("length", { ascending: true });

  if (error) {
    console.error("Error fetching data:", error);
    return [];
  }

  // Fetch volume data from case_details
  const imageIds = CASES.map((c) => c.image_id);
  if (imageIds.length > 0) {
    const { data: details } = await supabase
      .from("case_details")
      .select("image_id, volume, product_name")
      .in("image_id", imageIds);

    if (details) {
      const volumeMap = {};
      details.forEach((d) => {
        volumeMap[d.image_id] = { volume: d.volume, detail_name: d.product_name };
      });
      CASES = CASES.map((c) => ({
        ...c,
        volume: volumeMap[c.image_id]?.volume || null,
      }));
    }
  }

  return CASES;
}
