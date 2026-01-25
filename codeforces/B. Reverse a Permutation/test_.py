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
4
3 2 1 4
3
3 1 2
4
4 3 2 1
2
2 1
"""

    expected_output = """4 1 2 3
3 2 1
4 3 2 1
2 1
"""

    assert run_io_fun(input_data, solve) == expected_output
