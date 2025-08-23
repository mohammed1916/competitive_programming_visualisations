from typing import List
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        res = 0
        prefix_sums_until_now_freq = {0:1}
        prefix_sum_now = 0
        for j in range(len(nums)):
            prefix_sum_now += nums[j]
            # k = prefix_sum_now - prev_prefix_needed
            prev_prefix_needed = prefix_sum_now - k

            res += prefix_sums_until_now_freq.get(prev_prefix_needed,0)
            prefix_sums_until_now_freq[prefix_sum_now] = 1+prefix_sums_until_now_freq.get(prefix_sum_now,0)
        return res

