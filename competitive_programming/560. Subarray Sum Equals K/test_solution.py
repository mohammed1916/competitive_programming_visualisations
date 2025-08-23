from solution import Solution
    
def test_subarray_sum_basic():
    sol = Solution()
    assert sol.subarraySum([1, 1, 1], 2) == 2  # expected output: 2

def test_subarray_sum_with_zero():
    sol = Solution()
    assert sol.subarraySum([1, 2, 3], 3) == 2  # subarrays: [1,2], [3]

def test_subarray_sum_negative_numbers():
    sol = Solution()
    assert sol.subarraySum([1, -1, 0], 0) == 3  # subarrays: [1,-1], [0], [1,-1,0]

def test_subarray_sum_single_element():
    sol = Solution()
    assert sol.subarraySum([5], 5) == 1
    assert sol.subarraySum([5], 3) == 0