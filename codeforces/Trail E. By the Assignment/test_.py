# test_solution.py
import pytest
import subprocess

def run_solution(input_str):
    result = subprocess.run(
        ["python", "solution.py"],
        input=input_str,   # pass string directly
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def test_example_cases():
    input_data = """5
4 4 4
-1 -1 -1 -1
1 2
2 3
1 3
4 3
5 6 7
2 2 -1 2 2
1 2
1 3
1 4
2 5
3 5
4 5
7 8 9
-1 -1 -1 -1 0 -1 0
1 2
2 3
3 4
1 4
1 5
5 6
7 6
7 5
5 8 1000000000
1 2 3 4 -1
1 2
3 2
3 5
5 1
2 4
4 3
2 5
1 4
5 4 1000000000
-1 2 -1 3 -1
1 2
1 3
2 4
2 5"""
    expected_output = """4
1
9
0
747068572"""
    assert run_solution(input_data) == expected_output
