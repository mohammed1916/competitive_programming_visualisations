# import sys
# input = sys.stdin.readline

# def solve_case(n, k, arr):
#     mx = max(arr)
#     res = []
#     for ai in arr:
#         diff = (mx - ai) % k
#         res.append(ai + diff)
#     return res

# def solve():
#     t = int(input())
#     for _ in range(t):
#         n, k = map(int, input().split())
#         arr = list(map(int, input().split()))
#         result = solve_case(n, k, arr)
#         print(*result)

# solution.py
import sys
from typing import List, Tuple

def transform_case(n: int, k: int, arr: List[int]) -> List[int]:
    """
    Construct final array for one test case:
      final[i] = arr[i] + t_i * k,  where 0 <= t_i <= k (integer)
    so that gcd(final) > 1.

    Construction: take p = k + 1 (gcd(k, p) = 1). Solve
      arr[i] + t_i * k ≡ 0 (mod p)
    => t_i ≡ -arr[i] * inv_k (mod p), and since residues 0..k are available,
    the representative in 0..k works.
    """
    p = k + 1
    inv_k = pow(k, -1, p)  # modular inverse of k modulo p (exists since gcd(k,p)=1)
    res = []
    for ai in arr:
        t = (-ai * inv_k) % p   # 0..k
        res.append(ai + t * k)
    return res

def process(cases: List[Tuple[int, int, List[int]]]) -> List[List[int]]:
    """
    cases: list of (n, k, arr)
    returns: list of resulting arrays
    """
    return [transform_case(n, k, arr) for (n, k, arr) in cases]

# Optional Codeforces-style I/O. Use this when submitting to CF (uncomment at bottom).
def solve():
    data = sys.stdin.read().strip().split()
    it = iter(data)
    t = int(next(it))
    out_lines = []
    for _ in range(t):
        n = int(next(it)); k = int(next(it))
        arr = [int(next(it)) for _ in range(n)]
        res = transform_case(n, k, arr)
        out_lines.append(" ".join(map(str, res)))
    sys.stdout.write("\n".join(out_lines))

if __name__ == "__main__":
    # For Codeforces submission: keep this line.
    solve()

    # If you prefer to use the function interface in other contexts,
    # import `process` or `transform_case` from this module.
