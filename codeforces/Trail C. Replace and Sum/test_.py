import pytest
import io
import sys
from solution import solve


def run_io_fun(input_str, func):
    sys.stdin = io.StringIO(input_str)
    sys.stdout = io.StringIO()
    func()
    return sys.stdout.getvalue()


def test_sample():
    input_data = """4
3 1
3 2 1
1 2 3
1 3
1 1
1
2
1 1
3 2
6 7 5
9 6 8
1 2
2 3
4 3
4 3 2 1
5 1 3 1
1 2
2 4
3 4
"""

    expected_output = """9
2
17 16
8 7 4
"""

    assert run_io_fun(input_data, solve) == expected_output
