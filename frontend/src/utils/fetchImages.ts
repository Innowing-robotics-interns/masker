export const fetchImageFromBackend = async (dir: string) => {
  try {
    console.log(dir);
    const response = await fetch(dir);
    if (!response.ok) throw new Error("Image not found");

    const base64Data = await response.text();
    return `data:image/png;base64,${base64Data}`;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
};

export const getImageList = async () => {
  try {
    const response = await fetch("/datasets/test1/images");
    if (!response.ok) throw new Error("Image list not found");

    const files = await response.json();
    return files.map((file: string) => ({
      name: file,
      dir: `/datasets/test1/images/${file}`,
    }));
  } catch (error) {
    console.error("Error fetching image list:", error);
    return [];
  }
};
