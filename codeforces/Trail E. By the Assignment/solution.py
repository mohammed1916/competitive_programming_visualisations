import sys
from collections import defaultdict, deque

MOD = 998244353

def solve():
    input = sys.stdin.read
    data = input().split()
    idx = 0
    t = int(data[idx])
    idx += 1
    results = []

    for _ in range(t):
        n = int(data[idx])
        m = int(data[idx + 1])
        V = int(data[idx + 2])
        idx += 3

        a = list(map(int, data[idx:idx + n]))
        idx += n

        graph = [[] for _ in range(n)]
        edges = []
        for _ in range(m):
            u = int(data[idx]) - 1
            v = int(data[idx + 1]) - 1
            idx += 2
            graph[u].append(v)
            graph[v].append(u)
            edges.append((u, v))

        unknowns = [i for i, val in enumerate(a) if val == -1]
        num_unknowns = len(unknowns)

        # Step 1: If tree (m == n-1) → all unknowns free
        if m == n - 1:
            results.append(pow(V, num_unknowns, MOD))
            continue

        # Step 2: BFS to assign tentative XOR values
        val = [None] * n
        val[0] = 0 if a[0] == -1 else a[0]
        parent = [-1] * n
        queue = deque([0])
        while queue:
            u = queue.popleft()
            for v in graph[u]:
                if val[v] is None:
                    val[v] = 0 if a[v] == -1 else val[u] ^ a[v]
                    parent[v] = u
                    queue.append(v)

        # Step 3: Count independent cycles
        visited_edges = set()
        cycles = 0
        for u, v in edges:
            if (u, v) in visited_edges or (v, u) in visited_edges:
                continue
            visited_edges.add((u, v))
            if parent[v] == u or parent[u] == v:
                continue  # tree edge
            # extra edge → cycle exists
            cycles += 1

        free_vars = num_unknowns - cycles
        if free_vars < 0:
            results.append(0)
        else:
            results.append(pow(V, free_vars, MOD))

    print("\n".join(map(str, results)))


if __name__ == "__main__":
    solve()
