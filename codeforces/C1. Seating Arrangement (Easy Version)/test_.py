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
    input_data = """6
5 2 2
EIAIE
20 5 5
AEIEEEEIEAAEIEEEEIEA
8 2 4
AAAAAIEE
8 4 2
AIEAEAAI
8 3 3
AIEAEAAI
4 2 2
IAEE
"""
    expected = """4
20
7
7
7
4"""
    assert run_io_fun(input_data, solve).strip() == expected


def test_basic_edges():
    input_data = """6
3 1 1
EEE
3 1 1
IAA
5 1 2
AAEAE
5 2 2
EEEEE
4 1 3
IEAE
4 3 2
IIII
"""
    expected = """0
1
2
0
3
3"""
    assert run_io_fun(input_data, solve).strip() == expected