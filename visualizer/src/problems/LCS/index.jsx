export const meta = {
  number: "1143",
  title: "Longest Common Subsequence",
  slug: "longest-common-subsequence",
  difficulty: "Medium",
  tags: ["String", "DP"],
  description: "2D DP: dp[i][j] = dp[i-1][j-1]+1 on match, else max of dp[i-1][j] and dp[i][j-1].",
  accent: "#a855f7",
};
export { default } from "./LCSVisualizer";
