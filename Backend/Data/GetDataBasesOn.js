import supabase from "../supabase";

export default async function getFilteredCases(gpuLength, gpuHeight, gpuSlots) {
  let { data: CASES, error } = await supabase
    .from("CASES")
    .select("*")
    .gte("length", gpuLength)
    .gte("height", gpuHeight)
    .gte("slots", gpuSlots);

  if (error) {
    console.error("Error fetching data:", error);
    return [];
  }

  return CASES;
}
//const imagelocation1 = `https://github.com/MariooY2/Redditfreelance4/blob/main/public/images/${caseItem.image_id}/1.jpg?raw=true`;