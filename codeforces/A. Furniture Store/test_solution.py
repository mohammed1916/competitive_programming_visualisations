import pytest
import io
import sys
from solution import solve

def run_io_fun(input_str, func):
    sys.stdin = io.StringIO(input_str)
    sys.stdout = io.StringIO()
    func()
    return sys.stdout.getvalue()

def test_codeforces_samples():
    input_data = """4
3
1 2 3
4
4 6 2 1
1
100
6
7 5 8 4 6 2
"""
    expected_output = """2
2 3
1
2
0
2
3 5
"""
    assert run_io_fun(input_data, solve) == expected_output
