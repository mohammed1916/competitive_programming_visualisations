from manim import *

class AdditiveNumberFullIterations(Scene):
    def construct(self):
        example = "199100199"

        title = Text("Additive Number Sequence Checker", font_size=40).to_edge(UP)
        string_text = Text(f"Input: {example}", font_size=36).next_to(title, DOWN, buff=0.5)
        self.play(Write(title), Write(string_text))

        array_boxes = VGroup()
        array_numbers = VGroup()
        start_x = - (len(example) - 1) * 0.4
        for i, digit in enumerate(example):
            box = Rectangle(height=0.75, width=0.6)
            box.move_to([start_x + i * 0.8, 1, 0])
            num = Text(digit, font_size=24).move_to(box.get_center())
            array_boxes.add(box)
            array_numbers.add(num)

        self.play(Create(array_boxes), Write(array_numbers))

        n = len(example)
        found = False

        for i in range(1, n):
            if example[0] == '0' and i > 1:
                break
            for j in range(i + 1, n):
                if example[i] == '0' and j - i > 1:
                    break

                first = example[:i]
                second = example[i:j]
                a, b = first, second
                k = j

                vis1 = array_boxes[:i]
                vis2 = array_boxes[i:j]
                label1 = Text("first", font_size=20).next_to(VGroup(*vis1), UP)
                label2 = Text("second", font_size=20).next_to(VGroup(*vis2), UP)
                self.play(
                    *[box.animate.set_fill(BLUE, opacity=0.3) for box in vis1],
                    *[box.animate.set_fill(ORANGE, opacity=0.3) for box in vis2],
                    Write(label1), Write(label2)
                )

                temp_groups = [label1, label2]
                valid = True
                all_sum_boxes = []

                while k < n:
                    s = str(int(a) + int(b))
                    next_k = k + len(s)
                    if not example.startswith(s, k):
                        valid = False
                        wrong_text = Text(f"{a}+{b}={s} Mismatch!", color=RED, font_size=28).to_edge(DOWN)
                        self.play(Write(wrong_text))
                        self.wait(1)
                        self.play(FadeOut(wrong_text))
                        break

                    highlight = VGroup(*array_boxes[k:next_k]).copy().set_fill(GREEN, opacity=0.3)
                    label = Text(f"{a}+{b}={s}", font_size=20).next_to(highlight, DOWN)
                    self.play(FadeIn(highlight), Write(label))
                    temp_groups.extend([highlight, label])
                    all_sum_boxes.append(highlight)
                    a, b = b, s
                    k = next_k

                if valid and k == n:
                    found = True
                    self.play(*[FadeOut(m) for m in temp_groups])
                    break
                else:
                    self.play(*[FadeOut(m) for m in temp_groups])

                self.play(*[box.animate.set_fill(WHITE, opacity=1) for box in array_boxes])

            if found:
                break

        if not found:
            self.play(Write(Text("No valid additive sequence found!", color=RED, font_size=32).next_to(string_text, DOWN, buff=1)))
            self.wait(2)
            return

        success = Text("Valid Additive Sequence!", color=GREEN, font_size=36).to_edge(DOWN)
        self.play(Write(success))
        self.wait(2)
