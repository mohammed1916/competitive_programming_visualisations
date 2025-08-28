def solve_bitset(test_cases):
    results = []

    for n, k, s in test_cases:
        # Check for k consecutive '1's → impossible
        max_ones = 0
        count = 0
        for c in s:
            if c == '1':
                count += 1
                if count >= k:
                    max_ones = count
                    break
            else:
                count = 0
        if max_ones >= k:
            results.append(("NO", []))
            continue

        # Construct permutation
        p = [0] * n
        left, right = 1, n
        for i, c in enumerate(s):
            if c == '1':
                p[i] = left
                left += 1
            else:
                p[i] = right
                right -= 1

        results.append(("YES", p))

    return results


def main():
    import sys
    input = sys.stdin.read
    data = input().split()
    t = int(data[0])
    idx = 1
    test_cases = []

    for _ in range(t):
        n = int(data[idx])
        k = int(data[idx + 1])
        s = data[idx + 2]
        idx += 3
        test_cases.append((n, k, s))

    results = solve_bitset(test_cases)
    for res, perm in results:
        print(res)
        if res == "YES":
            print(" ".join(map(str, perm)))


if __name__ == "__main__":
    main()
