from collections import defaultdict

def longest_neat_subsequence(a):
    """
    Returns the length of the longest neat subsequence.
    A neat subsequence is a concatenation of blocks where each block
    has all elements equal to its length.
    """
    current_count = defaultdict(int)
    result = 0

    for x in a:
        if current_count[x] < x - 1:
            current_count[x] += 1
        else:
            result += x
            current_count[x] = 0

    return result


def main():
    import sys
    input = sys.stdin.read
    data = input().split()

    t = int(data[0])
    idx = 1
    ans = []
    
    for _ in range(t):
        n = int(data[idx])
        idx += 1
        a = list(map(int, data[idx:idx+n]))
        idx += n
        ans.append(str(longest_neat_subsequence(a)))

    print("\n".join(ans))


if __name__ == "__main__":
    main()
