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
    input_data = """6
3 3 5
1 1 1
3 8 2
1 2 3
4 7 2
1 1 1 1
3 15 1
2 4 10
2 100 5
4 6
5 12 1
1 2 2 3 2
"""

    expected_output = """YES
YES
NO
NO
YES
YES
"""
    print("running")
    assert run_io_fun(input_data, solve) == expected_output

test_sample()