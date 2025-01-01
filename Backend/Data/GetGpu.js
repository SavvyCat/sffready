import supabase from "../supabase";
export default async function getFilteredGPUs(partialMatch, selectedCategory) {
  console.log(selectedCategory);
  function separateNumberAndCharacter(input) {
    const result = input.replace(
      /(\d+)([a-zA-Z]+)|([a-zA-Z]+)(\d+)/,
      (match, num, char, charFirst, numFirst) => {
        if (num && char) {
          return `${num} ${char}`;
        } else if (charFirst && numFirst) {
          return `${charFirst} ${numFirst}`;
        }
      }
    );
    return result;
  }
  const match = separateNumberAndCharacter(partialMatch);

  if (selectedCategory === "All Brands") {
    let query = supabase.from("GPU").select("*").ilike("title", `%${match}%`);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching GPUs:", error);
      return [];
    }
    console.log(data);
    return data;
  } else {
    const { data: data1, error: error1 } = await supabase
      .from("GPU")
      .select("*")
      .ilike("title", `%${match}%`);

    const { data: data2, error: error2 } = await supabase
      .from("GPU")
      .select("*")
      .eq("category", selectedCategory);


    console.log(data2);

    if (error1) {
      console.error("Error fetching GPUs:", error1);
      return [];
    }
    if (error2) {
      console.error("Error fetching categorys:", error2);
      return [];
    }
    const intersection = data1?.filter((item1) =>
      data2.some((item2) => item1.image_id === item2.image_id)
    );

    console.log(intersection);
    return intersection;
  }
}
