export const meta = {
  number: "338",
  title: "Counting Bits",
  slug: "counting-bits",
  difficulty: "Easy",
  tags: ["DP", "Bit Manipulation"],
  description: "dp[i] = dp[i >> 1] + (i & 1): the bit count of i is one more than the count for i with its lowest bit removed.",
  accent: "#22c55e",
};
export { default } from "./CountingBitsVisualizer";
