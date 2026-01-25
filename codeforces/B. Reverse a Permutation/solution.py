def solve():
    import sys
    input = sys.stdin.readline

    number_of_test_cases = int(input().strip())

    for _ in range(number_of_test_cases):

        length_of_permutation = int(input().strip())
        given_permutation = list(map(int, input().split()))

        # suffix_max_value_from_position[i] =
        # maximum value from index i to end
        suffix_max_value_from_position = [0] * length_of_permutation
        suffix_max_value_from_position[-1] = given_permutation[-1]

        for current_index in range(length_of_permutation - 2, -1, -1):
            suffix_max_value_from_position[current_index] = max(
                suffix_max_value_from_position[current_index + 1],
                given_permutation[current_index]
            )

        # Index where we should start reversing
        start_index_of_reverse_segment = -1

        # Index where we should stop reversing
        end_index_of_reverse_segment = -1

        # Find first position where we can improve lexicographically
        for current_index in range(length_of_permutation):

            current_value = given_permutation[current_index]
            maximum_value_after_current = suffix_max_value_from_position[current_index]

            if current_value < maximum_value_after_current:
                start_index_of_reverse_segment = current_index
                break

        # If no improvement is possible, print original permutation
        if start_index_of_reverse_segment == -1:
            print(" ".join(map(str, given_permutation)))
            continue

        # Value we want to bring forward
        value_to_move_to_front = suffix_max_value_from_position[
            start_index_of_reverse_segment
        ]

        # Find the last position of that value
        for current_index in range(
            length_of_permutation - 1,
            start_index_of_reverse_segment - 1,
            -1
        ):
            if given_permutation[current_index] == value_to_move_to_front:
                end_index_of_reverse_segment = current_index
                break

        # Reverse the selected part
        given_permutation[
            start_index_of_reverse_segment:
            end_index_of_reverse_segment + 1
        ] = reversed(
            given_permutation[
                start_index_of_reverse_segment:
                end_index_of_reverse_segment + 1
            ]
        )

        print(" ".join(map(str, given_permutation)))


if __name__ == "__main__":
    solve()
