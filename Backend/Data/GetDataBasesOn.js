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

  return CASES;
}
