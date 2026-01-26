def solve():
    import sys
    input = sys.stdin.readline

    number_of_test_cases = int(input().strip())

    for _ in range(number_of_test_cases):

        array_length, number_of_queries = map(int, input().split())

        initial_array = list(map(int, input().split()))
        replacement_array = list(map(int, input().split()))

        # best_possible_value[i] = max(a[i], b[i])
        best_possible_value = [0] * array_length

        for i in range(array_length):
            best_possible_value[i] = max(
                initial_array[i],
                replacement_array[i]
            )

        # Build suffix maximum
        for i in range(array_length - 2, -1, -1):
            best_possible_value[i] = max(
                best_possible_value[i],
                best_possible_value[i + 1]
            )

        # Prefix sum
        prefix_sum = [0] * (array_length + 1)

        for i in range(array_length):
            prefix_sum[i + 1] = prefix_sum[i] + best_possible_value[i]

        # Answer queries
        answers = []

        for _ in range(number_of_queries):
            left, right = map(int, input().split())

            left -= 1
            right -= 1

            result = prefix_sum[right + 1] - prefix_sum[left]
            answers.append(str(result))

        print(" ".join(answers))


if __name__ == "__main__":
    solve()
