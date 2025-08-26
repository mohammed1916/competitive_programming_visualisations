# test_solution.py
import math
import solution

def check_result_case(n, k, arr, res):
    assert len(res) == n
    # each output must be arr[i] + t*k where 0 <= t <= k
    for ai, afi in zip(arr, res):
        diff = afi - ai
        assert diff % k == 0, f"diff {diff} not multiple of k"
        t = diff // k
        assert 0 <= t <= k, f"t={t} out of bounds [0, {k}]"
    # gcd must be > 1
    g = 0
    for v in res:
        g = math.gcd(g, v)
    assert g > 1, f"gcd is {g} (not > 1)"

def test_sample_cases():
    cases = [
        (3, 3, [2, 7, 1]),
        (4, 5, [2, 9, 16, 14]),
        (4, 1, [1, 2, 3, 4]),
        (5, 2, [5, 6, 7, 8, 9]),
        (2, 10, [7, 9]),
        (1, 1000000000, [1]),
        (1, 371, [1000000000]),
        (3, 6, [1, 3, 5]),
    ]

    results = solution.process(cases)
    for (n, k, arr), res in zip(cases, results):
        check_result_case(n, k, arr, res)
