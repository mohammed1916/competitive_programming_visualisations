# solution.py

def solve():
    t = int(input())

    for _ in range(t):
        n = int(input())

        a = input().strip()
        b = input().strip()

        ok = True

        depth = 0
        mixed_parity = 0

        for i in range(n):

            # same brackets
            if a[i] == b[i]:

                # "(("
                if a[i] == '(':
                    depth += 1

                # "))"
                else:
                    depth -= 1

                    if depth < 0:
                        ok = False

                    # completed one block
                    if depth == 0:
                        if mixed_parity:
                            ok = False

                        mixed_parity = 0

            # mixed column: "()" or ")("
            else:
                if depth == 0:
                    ok = False

                mixed_parity ^= 1

        if depth != 0 or mixed_parity != 0:
            ok = False

        print("YES" if ok else "NO")


if __name__ == "__main__":
    solve()

