export const emptySpecifications = {
  material: "",
  color: "",
  productType: "",
  genericName: "",
  netQuantity: "1",
  length: "",
  breadth: "",
  height: "",
  dimensionUnit: "cm",
  weight: "",
  weightUnit: "g",
  countryOfOrigin: "India",
  finish: "",
  packageContents: "",
  careInstructions: "",
  artisanRegion: "",
};

export function parseProductDetails(rawDescription) {
  if (!rawDescription) {
    return { summary: "", specifications: { ...emptySpecifications } };
  }

  try {
    const parsed = JSON.parse(rawDescription);
    if (parsed && parsed.__climoraoneProductDetails === 1) {
      return {
        summary: parsed.summary || "",
        specifications: {
          ...emptySpecifications,
          ...(parsed.specifications || {}),
        },
      };
    }
  } catch {
    // Existing products use a plain-text description and remain supported.
  }

  return {
    summary: rawDescription,
    specifications: { ...emptySpecifications },
  };
}

export function serializeProductDetails(summary, specifications) {
  return JSON.stringify({
    __climoraoneProductDetails: 1,
    summary: summary || "",
    specifications: {
      ...emptySpecifications,
      ...(specifications || {}),
    },
  });
}

export function visibleSpecifications(specifications = {}) {
  const labels = {
    material: "Material",
    color: "Color",
    productType: "Product Type",
    genericName: "Generic Name",
    netQuantity: "Net Quantity",
    length: "Length",
    breadth: "Breadth",
    height: "Height",
    weight: "Weight",
    finish: "Finish",
    packageContents: "Package Contents",
    careInstructions: "Care Instructions",
    artisanRegion: "Craft / Artisan Region",
    countryOfOrigin: "Country of Origin",
  };

  return Object.entries(labels)
    .map(([key, label]) => {
      let value = specifications[key];
      if (value === "" || value === null || value === undefined) return null;
      if (["length", "breadth", "height"].includes(key)) {
        value = `${value} ${specifications.dimensionUnit || "cm"}`;
      }
      if (key === "weight") value = `${value} ${specifications.weightUnit || "g"}`;
      return { key, label, value };
    })
    .filter(Boolean);
}
