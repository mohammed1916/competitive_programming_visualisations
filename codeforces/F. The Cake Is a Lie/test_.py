import io
import sys

from solution import solve


def run_io_fun(input_str, func):
    original_stdin = sys.stdin
    original_stdout = sys.stdout
    try:
        sys.stdin = io.StringIO(input_str)
        sys.stdout = io.StringIO()
        func()
        return sys.stdout.getvalue()
    finally:
        sys.stdin = original_stdin
        sys.stdout = original_stdout


def test_sample():
    input_data = """7
17 1 1 1
123456789 987 654 321
3 11 37 111111
987654321 1 2 123456789
100 1 2 1
100 1 2 2
1 1 1 1
"""
    expected = """17
0
2
987654320
50
67
1"""
    assert run_io_fun(input_data, solve).strip() == expected


def test_basic_edges_and_cycles():
    input_data = """6
10 2 1 6
10 2 3 1
5 4 4 8
5 4 4 7
2 5 7 1
3 3 6 9
"""
    expected = """9
0
5
0
0
2"""
    assert run_io_fun(input_data, solve).strip() == expected