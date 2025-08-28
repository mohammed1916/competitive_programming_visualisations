import pytest
from solution import can_dream_come_true

@pytest.mark.parametrize("a,b,c,d,expected", [
    (1, 4, 1, 4, "YES"),
    (4, 1, 4, 1, "YES"),
    (1, 4, 2, 5, "YES"),
    (0, 100, 0, 100, "NO"),
    (1, 4, 2, 9, "NO"),
    (3, 1, 13, 5, "YES"),
    (8, 11, 17, 36, "NO"),
    (19, 41, 30, 50, "NO"),
    (20, 38, 30, 60, "YES"),
    (0, 0, 0, 0, "YES"),
    (100, 100, 100, 100, "YES"),
])
def test_can_dream_come_true(a, b, c, d, expected):
    assert can_dream_come_true(a, b, c, d) == expected
