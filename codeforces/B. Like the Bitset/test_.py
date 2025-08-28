import pytest
from solution import solve_bitset

@pytest.mark.parametrize("test_cases,expected", [
    (
        [(2, 1, "00"), (4, 3, "0010"), (5, 2, "11011"), (7, 5, "1111110"), (8, 4, "00101011"), (10, 2, "1000000010")],
        [
            ("YES", [1, 2]),
            ("YES", [1, 2, 3, 4]),
            ("NO", []),
            ("NO", []),
            ("YES", [5, 6, 1, 7, 2, 8, 3, 4]),
            ("YES", [1, 2, 3, 4, 5, 6, 7, 10, 9, 8])
        ]
    )
])
def test_bitset(test_cases, expected):
    results = solve_bitset(test_cases)
    for (res, perm), (exp_res, exp_perm) in zip(results, expected):
        assert res == exp_res
        if res == "YES":
            # Check if permutation is valid
            assert sorted(perm) == list(range(1, len(perm)+1))
