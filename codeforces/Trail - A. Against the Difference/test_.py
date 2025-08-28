# test_solution.py
import pytest
from io import StringIO
import sys
from solution import main

@pytest.mark.parametrize(
    "input_data, expected_output",
    [
        (
            "6\n1\n1\n2\n2 2\n4\n2 2 1 1\n6\n1 2 3 3 3 1\n8\n8 8 8 8 8 8 7\n10\n2 3 3 1 2 3 5 1 1 7\n",
            "1\n2\n4\n5\n0\n5\n"
        ),
        (
            "1\n5\n1 1 1 1 1\n",
            "5\n"
        ),
        (
            "2\n3\n2 2 2\n4\n1 2 3 4\n",
            "2\n1\n"
        )
    ]
)
def test_main(input_data, expected_output, monkeypatch, capsys):
    monkeypatch.setattr(sys, "stdin", StringIO(input_data))
    main()
    captured = capsys.readouterr()
    assert captured.out == expected_output
