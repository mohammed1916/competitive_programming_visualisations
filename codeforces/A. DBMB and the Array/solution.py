# solution.py

def solve():
    import sys
    input = sys.stdin.readline

    test_cases = int(input().strip())

    for _ in range(test_cases):
        array_size, target_sum, increment = map(int, input().split())
        numbers = list(map(int, input().split()))

        current_sum = sum(numbers)

        # Difference needed to reach target sum
        required_increase = target_sum - current_sum

        if required_increase < 0:
            print("NO")
        elif required_increase % increment == 0:
            print("YES")
        else:
            print("NO")


if __name__ == "__main__":
    solve()

