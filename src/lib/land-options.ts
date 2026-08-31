/** Газар зар оруулах — эрхийн төрөл, ашиглалтын төрөл */

export const LAND_RIGHT_OPTIONS = [
  {
    value: "ownership",
    label: "Өмчлөх",
    hint: "Хугацаагүй",
  },
  {
    value: "possession",
    label: "Эзэмших",
    hint: "Гэрээний хугацаатай",
  },
  {
    value: "use",
    label: "Ашиглах",
    hint: "Гэрээний хугацаатай",
  },
] as const;

export const LAND_USE_OPTIONS = [
  { value: "service_apartment", label: "Үйлчилгээтэй орон сууц" },
  { value: "household", label: "Аж, ахуйн" },
  { value: "residential_yard", label: "Гэр, орон сууц хашааны газар" },
  { value: "private_residence", label: "Амины орон сууц" },
  { value: "other", label: "Бусад" },
] as const;

export type LandRightType = (typeof LAND_RIGHT_OPTIONS)[number]["value"];
export type LandUseType = (typeof LAND_USE_OPTIONS)[number]["value"];

export function getLandRightLabel(value?: string | null) {
  return LAND_RIGHT_OPTIONS.find((o) => o.value === value)?.label || value || "";
}

export function getLandUseLabel(value?: string | null) {
  return LAND_USE_OPTIONS.find((o) => o.value === value)?.label || value || "";
}

export function landRightNeedsContract(value?: string | null) {
  return value === "possession" || value === "use";
}
