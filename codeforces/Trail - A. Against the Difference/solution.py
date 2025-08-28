# solution.py
import sys
from collections import defaultdict

def main():
    input = sys.stdin.readline
    t = int(input())
    
    for _ in range(t):
        n = int(input())
        a = list(map(int, input().split()))
        
        counts = defaultdict(int)
        ans = 0
        
        for x in a:
            counts[x] += 1
            if counts[x] == x:
                ans += x
                counts[x] = 0  # reset for next block
        
        print(ans)

if __name__ == "__main__":
    main()
