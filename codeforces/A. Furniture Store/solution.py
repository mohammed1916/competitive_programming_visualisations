def solve():
    import sys
    input = sys.stdin.readline

    t = int(input().strip())
    for _ in range(t):
        n = int(input().strip())
        a = list(map(int, input().split()))

        never_ordered = []
        min_so_far = float("inf")

        for i in range(n):
            if a[i] > min_so_far:
                never_ordered.append(i + 1)  # 1-based index
            else:
                min_so_far = a[i]

        print(len(never_ordered))
        if never_ordered:
            print(" ".join(map(str, never_ordered)))


if __name__ == "__main__":
    solve()
