import sys

def read_int():
    return int(sys.stdin.readline())

def read_ints():
    return list(map(int, sys.stdin.readline().split()))

def find_robot():
    t = read_int()
    
    for _ in range(t):
        n = read_int()
        anchors = [tuple(read_ints()) for _ in range(n)]
        
        # Strategy: move R and U with a large k to find coordinates
        moves = [
            ("R", 10**9),
            ("U", 10**9)
        ]

        responses = []
        for direction, k in moves:
            print(f"? {direction} {k}")
            sys.stdout.flush()
            s = read_int()
            if s == -1:
                exit(0)
            responses.append((direction, k, s))
        
        r_move, r_s = responses[0][1], responses[0][2]
        u_move, u_s = responses[1][1], responses[1][2]
        
        X = r_move - r_s
        Y = u_move - u_s
        
        print(f"! {X} {Y}")
        sys.stdout.flush()

if __name__ == "__main__":
    find_robot()
