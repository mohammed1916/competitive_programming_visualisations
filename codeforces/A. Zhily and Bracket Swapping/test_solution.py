import pytest
import io
import sys
from solution import solve


def run_io_fun(input_str, func):
    backup_stdin = sys.stdin
    backup_stdout = sys.stdout

    sys.stdin = io.StringIO(input_str)
    sys.stdout = io.StringIO()

    func()

    output = sys.stdout.getvalue()

    sys.stdin = backup_stdin
    sys.stdout = backup_stdout

    return output


def test_sample():
    input_data = """7
2
()
()
4
))((
(())
4
((((
))))
4
()()
(())
6
(((())
()()))
8
()()()()
(((())))
4
((((
((((
"""

    expected_output = """YES
NO
NO
YES
YES
YES
NO
"""

    assert run_io_fun(input_data, solve) == expected_output