export const PROBLEM_CODE_REGISTRY = {
  'contains-duplicate': [
    { line: 1, text: 'def containsDuplicate(nums):' },
    { line: 2, text: '    seen = set()' },
    { line: 3, text: '    for n in nums:' },
    { line: 4, text: '        if n in seen:' },
    { line: 5, text: '            return True' },
    { line: 6, text: '        seen.add(n)' },
    { line: 7, text: '    return False' },
  ],
  'house-robber': [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def rob(self, nums):' },
    { line: 3, text: '        if not nums: return 0' },
    { line: 4, text: '        prev2 = 0' },
    { line: 5, text: '        prev1 = 0' },
    { line: 6, text: '        for money in nums:' },
    { line: 7, text: '            take = prev2 + money' },
    { line: 8, text: '            skip = prev1' },
    { line: 9, text: '            curr = max(take, skip)' },
    { line: 10, text: '            prev2 = prev1' },
    { line: 11, text: '            prev1 = curr' },
    { line: 12, text: '        return prev1' },
  ],
  'move-zeroes': [
    { line: 1, text: 'def moveZeroes(nums):' },
    { line: 2, text: '    k = 0  # next write position for non-zero' },
    { line: 3, text: '    for i in range(len(nums)):' },
    { line: 4, text: '        if nums[i] != 0:' },
    { line: 5, text: '            nums[k], nums[i] = nums[i], nums[k]' },
    { line: 6, text: '            k += 1' },
  ],
  'remove-duplicates-from-sorted-array': [
    { line: 1, text: 'def removeDuplicates(nums):' },
    { line: 2, text: '    k = 1  # slow pointer (next write pos)' },
    { line: 3, text: '    for i in range(1, len(nums)):' },
    { line: 4, text: '        if nums[i] != nums[i - 1]:' },
    { line: 5, text: '            nums[k] = nums[i]' },
    { line: 6, text: '            k += 1' },
    { line: 7, text: '    return k' },
  ],
}

export function getProblemCodeLines(slug) {
  if (!slug) return []
  return PROBLEM_CODE_REGISTRY[slug] || []
}
