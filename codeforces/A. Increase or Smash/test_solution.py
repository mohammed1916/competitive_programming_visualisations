import pytest
from io import StringIO
import sys

def run_io_fun(input_str, func):
    backup_stdin, backup_stdout = sys.stdin, sys.stdout
    sys.stdin, sys.stdout = StringIO(input_str), StringIO()
    func()
    output = sys.stdout.getvalue()
    sys.stdin, sys.stdout = backup_stdin, backup_stdout
    return output

def test_example():
    input_str = """3
3
1 1 3
1
100
9
9 9 3 2 4 4 8 5 3
"""
    expected_output = """3
1
11
"""
    from solution import solve
    assert run_io_fun(input_str, solve) == expected_output
