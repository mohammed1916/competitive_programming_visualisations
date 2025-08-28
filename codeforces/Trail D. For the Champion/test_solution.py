import pytest
from io import StringIO
import sys

from solution import find_robot

class MockInteractor:
    def __init__(self, testcases):
        self.testcases = testcases
        self.case_idx = -1
        self.X = self.Y = None
        self.anchors = []
        self.lines = []  # lines to return to solution

    def readline(self):
        # Provide input as solution expects
        if self.case_idx == -1:
            self.case_idx += 1
            return f"{len(self.testcases)}\n"  # t
        elif not self.anchors:
            # provide n and anchor coordinates
            anchors, self.X, self.Y = self.testcases[self.case_idx]
            self.anchors = anchors.copy()
            self.n = len(anchors)
            self.anchor_lines = [f"{x} {y}\n" for x, y in anchors]
            self.anchor_idx = 0
            return f"{self.n}\n"
        elif self.anchor_idx < self.n:
            line = self.anchor_lines[self.anchor_idx]
            self.anchor_idx += 1
            return line
        else:
            # solution now prints moves and expects responses
            if self.lines:
                return self.lines.pop(0)
            return "0\n"  # default distance (won't actually be used)

    def write(self, s):
        s = s.strip()
        if s.startswith("?"):
            direction, k = s.split()[1:]
            k = int(k)
            if direction == "U":
                self.Y += k
            elif direction == "D":
                self.Y -= k
            elif direction == "L":
                self.X -= k
            elif direction == "R":
                self.X += k
            dist = min(abs(self.X - ax) + abs(self.Y - ay) for ax, ay in self.testcases[self.case_idx][0])
            self.lines.append(f"{dist}\n")
        elif s.startswith("!"):
            # solution reports final coordinates, move to next test case
            self.case_idx += 1
            self.anchors = []
            self.lines = []

    def flush(self):
        pass


def run_testcases(testcases):
    mock_io = MockInteractor(testcases)
    sys.stdin = mock_io
    sys.stdout = mock_io
    find_robot()

def test_example():
    testcases = [
        ([(0, 0)], 100, 99),
        ([(1, 1), (2, 2), (3, 3), (-1, -1)], -1, 0)
    ]
    run_testcases(testcases)

def test_single_anchor():
    testcases = [
        ([(5, 5)], 10, 10)
    ]
    run_testcases(testcases)

def test_multiple_anchors():
    testcases = [
        ([(0, 0), (2, 2), (-2, -2)], 1, -1)
    ]
    run_testcases(testcases)


"""

# test_solution.py
import sys
import builtins
import pytest
from solution import find_robot

class MockInteractor:
    def __init__(self, testcases):
        self.testcases = testcases
        self.case_idx = -1
        self.X = self.Y = None
        self.anchors = []
        self.lines = []  # lines to return to solution
        self.stage = 0   # 0: t, 1: n, 2: anchors, 3: moves

    def readline(self):
        if self.stage == 0:
            self.stage += 1
            return f"{len(self.testcases)}\n"
        elif self.stage == 1:
            # send n
            self.case_idx += 1
            anchors, self.X, self.Y = self.testcases[self.case_idx]
            self.anchors = anchors.copy()
            self.n = len(anchors)
            self.anchor_lines = [f"{x} {y}\n" for x, y in anchors]
            self.anchor_idx = 0
            self.stage += 1
            return f"{self.n}\n"
        elif self.stage == 2:
            if self.anchor_idx < self.n:
                line = self.anchor_lines[self.anchor_idx]
                self.anchor_idx += 1
                return line
            else:
                self.stage = 3
                return self.readline()
        elif self.stage == 3:
            if self.lines:
                return self.lines.pop(0)
            # default distance if solution asks extra (not used)
            return "0\n"

    def write(self, s):
        s = s.strip()
        if s.startswith("?"):
            # parse move
            direction, k = s.split()[1:]
            k = int(k)
            if direction == "U":
                self.Y += k
            elif direction == "D":
                self.Y -= k
            elif direction == "L":
                self.X -= k
            elif direction == "R":
                self.X += k
            # calculate distance to nearest anchor
            dist = min(abs(self.X - ax) + abs(self.Y - ay) for ax, ay in self.testcases[self.case_idx][0])
            self.lines.append(f"{dist}\n")
        elif s.startswith("!"):
            # solution reports final coordinates
            pass  # could verify here if needed

    def flush(self):
        pass

def run_testcases(testcases):
    mock = MockInteractor(testcases)
    sys.stdin = mock
    sys.stdout = mock
    find_robot()
    sys.stdin = sys.__stdin__
    sys.stdout = sys.__stdout__

def test_example():
    # Format: (anchors_list, initial_X, initial_Y)
    testcases = [
        ([(0, 0)], 100, 99),
        ([(1, 1), (2, 2), (3, 3), (-1, -1)], -1, 0)
    ]
    run_testcases(testcases)

def test_single_anchor():
    testcases = [
        ([(5, 5)], 10, 10)
    ]
    run_testcases(testcases)

def test_multiple_anchors():
    testcases = [
        ([(0, 0), (2, 2), (-2, -2)], 1, -1)
    ]
    run_testcases(testcases)


"""