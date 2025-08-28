import pytest
from solution import longest_neat_subsequence

@pytest.mark.parametrize(
    "a,expected",
    [
        ([1], 1),
        ([2, 2], 2),
        ([2, 2, 1, 1], 4),
        ([1, 2, 3, 3, 3, 1], 5),
        ([8, 8, 8, 8, 8, 8, 8, 7], 0),
        ([2, 3, 3, 1, 2, 3, 5, 1, 1, 7], 5),
    ]
)
def test_longest_neat_subsequence(a, expected):
    assert longest_neat_subsequence(a) == expected
