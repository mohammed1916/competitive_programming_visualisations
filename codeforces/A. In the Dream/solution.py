def can_dream_come_true(a, b, c, d):
    # Goals in second half
    ra = c - a
    rb = d - b
    
    for x, y in [(a, b), (ra, rb)]:
        if x > 2 * y + 2 or y > 2 * x + 2:
            return "NO"
    return "YES"


def main():
    import sys
    input = sys.stdin.read
    data = list(map(int, input().split()))
    
    t = data[0]
    idx = 1
    results = []

    for _ in range(t):
        a, b, c, d = data[idx:idx+4]
        idx += 4
        results.append(can_dream_come_true(a, b, c, d))
    
    print("\n".join(results))


if __name__ == "__main__":
    main()
