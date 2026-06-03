def solve():
    import sys
    input = sys.stdin.read
    data = input().split()
    
    t = int(data[0])
    index = 1
    results = []
    
    for _ in range(t):
        n = int(data[index]); index += 1
        arr = list(map(int, data[index:index+n])); index += n
        
        distinct_count = len(set(arr))
        # formula: 2 * distinct_count - 1
        results.append(2 * distinct_count - 1)
    
    print("\n".join(map(str, results)))
