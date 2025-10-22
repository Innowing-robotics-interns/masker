export const fetchImageFromBackend = async (
  imageName: string,
  dataset: string,
) => {
  try {
    const response = await fetch(`/datasets/${dataset}/images/${imageName}`);
    if (!response.ok) throw new Error("Image not found");

    const base64Data = await response.text();
    return `data:image/png;base64,${base64Data}`;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
};
