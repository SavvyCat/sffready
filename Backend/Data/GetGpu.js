import supabase from "../supabase";

export default async function getFilteredGPUs(partialMatch) {
  // Apply the 'ilike' filter for case-insensitive matching with a wildcard
  function separateNumberAndCharacter(input) {
    const result = input.replace(
      /(\d+)([a-zA-Z]+)|([a-zA-Z]+)(\d+)/,
      (match, num, char, charFirst, numFirst) => {
        if (num && char) {
          return `${num} ${char}`; // Handles number followed by character
        } else if (charFirst && numFirst) {
          return `${charFirst} ${numFirst}`; // Handles character followed by number
        }
      }
    );
    return result;
  }
  const match = separateNumberAndCharacter(partialMatch);
  console.log(match);
  let query = supabase.from("GPU").select("*").ilike("title", `%${match}%`); // `%` is a wildcard that matches any sequence of characters after the input

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching GPUs:", error);
    return [];
  }
  console.log(data);
  return data;
}
