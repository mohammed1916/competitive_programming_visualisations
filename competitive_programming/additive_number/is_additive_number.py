from manim import *

class AdditiveNumberVisualization(Scene):
    def construct(self):
        title = Text("Additive Number Sequence Checker", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Example input
        example = "199100199"
        string_text = Text(f"Input: {example}", font_size=36).next_to(title, DOWN, buff=0.5)
        self.play(Write(string_text))

        # Create visual array for input digits
        array_boxes = VGroup()
        array_numbers = VGroup()
        start_x = -5
        for i, digit in enumerate(example):
            box = Rectangle(height=0.75, width=0.6)
            box.move_to([start_x + i * 0.8, 1, 0])
            num = Text(digit, font_size=24).move_to(box.get_center())
            array_boxes.add(box)
            array_numbers.add(num)

        self.play(Create(array_boxes), Write(array_numbers))

        # Try to find valid additive prefix automatically
        def find_additive_prefix(num_str):
            n = len(num_str)
            for i in range(1, n):
                if num_str[0] == '0' and i > 1:
                    break
                for j in range(i+1, n):
                    if num_str[i] == '0' and j - i > 1:
                        break
                    first = num_str[:i]
                    second = num_str[i:j]
                    k = j
                    while k < n:
                        sum_val = str(int(first) + int(second))
                        if not num_str.startswith(sum_val, k):
                            break
                        k += len(sum_val)
                        first, second = second, sum_val
                    if k == n:
                        return num_str[:i], num_str[i:j]
            return None, None

        first_num, second_num = find_additive_prefix(example)
        if not first_num or not second_num:
            fail = Text("No valid additive sequence found!", color=RED, font_size=32).next_to(string_text, DOWN, buff=1)
            self.play(Write(fail))
            self.wait(2)
            return

        current_pos = len(first_num) + len(second_num)

        # Stack visualization
        stack_title = Text("Variables", font_size=30)
        stack_title.to_edge(RIGHT).shift(LEFT * 2 + UP * 2)
        self.play(Write(stack_title))

        stack_frame = Rectangle(height=3, width=2.5)
        stack_frame.next_to(stack_title, DOWN, buff=0.3)
        self.play(Create(stack_frame))

        def update_stack_vars(first, second, current_pos):
            return VGroup(
                Text(f"first_num: {first}", font_size=20),
                Text(f"second_num: {second}", font_size=20),
                Text(f"current_pos: {current_pos}", font_size=20)
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.2).move_to(stack_frame)

        stack_vars = update_stack_vars(first_num, second_num, current_pos)
        self.play(Write(stack_vars))

        # Visualize first and second number blocks
        rect1 = VGroup(*array_boxes[:len(first_num)]).copy()
        num1 = VGroup(*array_numbers[:len(first_num)]).copy()
        rect2 = VGroup(*array_boxes[len(first_num):current_pos]).copy()
        num2 = VGroup(*array_numbers[len(first_num):current_pos]).copy()

        target_pos1 = [-3, -1, 0]
        target_pos2 = [-1, -1, 0]

        var1_label = Text("first_num", font_size=20)
        var2_label = Text("second_num", font_size=20)

        self.play(
            rect1.animate.move_to(target_pos1),
            num1.animate.move_to(target_pos1),
            rect2.animate.move_to(target_pos2),
            num2.animate.move_to(target_pos2)
        )

        var1_label.next_to(rect1, UP, buff=0.2)
        var2_label.next_to(rect2, UP, buff=0.2)

        self.play(Write(var1_label), Write(var2_label))

        # Begin animation loop
        while current_pos < len(example):
            sum_val = str(int(first_num) + int(second_num))
            new_stack_vars = update_stack_vars(first_num, second_num, current_pos)
            self.play(Transform(stack_vars, new_stack_vars))

            rect_sum = Rectangle(height=0.75, width=0.6 * len(sum_val))
            rect_sum.set_fill(RED, opacity=0.3)
            rect_sum.next_to(VGroup(rect1, rect2), DOWN, buff=1.5)
            sum_text = Text(sum_val, font_size=30).move_to(rect_sum.get_center())
            sum_label = Text("sum", font_size=20).next_to(rect_sum, UP, buff=0.2)

            self.play(Create(rect_sum), Write(sum_text), Write(sum_label))

            array_segment = example[current_pos:current_pos + len(sum_val)]
            if sum_val != array_segment:
                error = Text("Invalid Sequence!", color=RED, font_size=36)
                error.next_to(rect_sum, DOWN, buff=1)
                self.play(Write(error))
                self.wait(2)
                return

            for i in range(current_pos, current_pos + len(sum_val)):
                array_boxes[i].set_fill(YELLOW, opacity=0.3)

            # Fade out old first number and its label
            self.play(FadeOut(rect1), FadeOut(num1), FadeOut(var1_label))

            # Promote second number to first using Transform
            self.play(
                Transform(rect2, rect2.copy().move_to(target_pos1)),
                Transform(num2, num2.copy().move_to(target_pos1)),
                Transform(var2_label, Text("first_num", font_size=20).next_to(rect2, UP, buff=0.2))
            )

            # Move sum into second slot
            self.play(
                Transform(rect_sum, rect_sum.copy().move_to(target_pos2)),
                Transform(sum_text, sum_text.copy().move_to(target_pos2)),
                Transform(sum_label, Text("second_num", font_size=20).next_to(rect_sum, UP, buff=0.2))
            )


            first_num = second_num
            second_num = sum_val
            rect1 = rect2
            num1 = num2
            rect2 = rect_sum
            num2 = sum_text
            var1_label = var2_label
            var2_label = sum_label
            current_pos += len(sum_val)


        success = Text("Valid Additive Sequence!", color=GREEN, font_size=36)
        success.next_to(sum_label, RIGHT, buff=1)
        self.play(FadeOut(sum_label))
        self.play(Write(success))
        self.wait(2)
