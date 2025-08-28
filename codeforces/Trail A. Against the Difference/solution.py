# solution.py
import sys
from collections import defaultdict

def main():
    input = sys.stdin.readline
    t = int(input())
    
    for _ in range(t):
        n = int(input())
        a = list(map(int, input().split()))
        
        dp = defaultdict(int)  # Tracks elements collected toward each block length
        ans = 0
        
        for x in a:
            dp[x] += 1
            if dp[x] == x:
                ans += x
                dp[x] = 0  # reset after completing a block

        print(ans)

if __name__ == "__main__":
    main()
