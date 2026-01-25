def solve():
    import sys
    input = sys.stdin.readline

    number_of_test_cases = int(input().strip())

    for _ in range(number_of_test_cases):

        array_length, number_of_queries = map(int, input().split())

        initial_array = list(map(int, input().split()))
        replacement_array = list(map(int, input().split()))

        # Compute suffix maximum of replacement_array (b)
        suffix_maximum_of_b = [0] * array_length
        suffix_maximum_of_b[-1] = replacement_array[-1]

        for index in range(array_length - 2, -1, -1):
            suffix_maximum_of_b[index] = max(
                suffix_maximum_of_b[index + 1],
                replacement_array[index]
            )

        # Compute best possible value for each position
        maximum_possible_array = [0] * array_length

        for index in range(array_length):
            maximum_possible_array[index] = max(
                initial_array[index],
                suffix_maximum_of_b[index]
            )

        # Build prefix sum for fast range queries
        prefix_sum_of_max_array = [0] * (array_length + 1)

        for index in range(array_length):
            prefix_sum_of_max_array[index + 1] = (
                prefix_sum_of_max_array[index]
                + maximum_possible_array[index]
            )

        # Answer queries
        answers = []

        for _ in range(number_of_queries):
            left, right = map(int, input().split())

            # Convert to 0-based indexing
            left -= 1
            right -= 1

            range_sum = (
                prefix_sum_of_max_array[right + 1]
                - prefix_sum_of_max_array[left]
            )

            answers.append(str(range_sum))

        print(" ".join(answers))


if __name__ == "__main__":
    solve()
