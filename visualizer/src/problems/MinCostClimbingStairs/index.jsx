export const meta = {
  number: '746',
  title: 'Min Cost Climbing Stairs',
  slug: 'min-cost-climbing-stairs',
  difficulty: 'Easy',
  tags: ['Array', 'DP'],
  description: 'dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]); answer is min(dp[n-1], dp[n]).',
  accent: '#22c55e',
}
export { default } from './MinCostClimbingStairsVisualizer'
