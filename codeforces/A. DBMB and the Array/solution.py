# solution.py

def solve():
    import sys
    input = sys.stdin.readline

    t = int(input().strip())
    for _ in range(t):
        n, s, x = map(int, input().split())
        a = list(map(int, input().split()))

        total = sum(a)

        if total > s:
            print("NO")
        else:
            diff = s - total
            if diff % x == 0:
                print("YES")
            else:
                print("NO")


if __name__ == "__main__":
    solve()
