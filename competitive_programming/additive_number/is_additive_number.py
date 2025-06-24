from manim import *

class AdditiveNumberVisualization(Scene):
    def construct(self):
        title = Text("Additive Number Sequence Checker", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        
        # Example string and array visualization
        example = "112358"
        string_text = Text(f"Input: {example}", font_size=36).next_to(title, DOWN, buff=0.5)
        self.play(Write(string_text))
        
        # Create array visualization
        array_boxes = VGroup()
        array_numbers = VGroup()
        start_x = -5
        for i, digit in enumerate(example):
            box = Rectangle(height=0.75, width=0.6)
            box.move_to([start_x + i*0.8, 1, 0])
            num = Text(digit, font_size=24).move_to(box.get_center())
            array_boxes.add(box)
            array_numbers.add(num)
        
        self.play(
            Create(array_boxes),
            Write(array_numbers)
        )
        
        # Variables section
        stack_title = Text("Variables", font_size=30)
        stack_title.to_edge(RIGHT).shift(LEFT * 3 + UP * 2)
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
        
        rect_height = 0.75
        start_x = -2
        first_num = "1"
        second_num = "1"
        
        # Initial stack visualization
        stack_vars = update_stack_vars(first_num, second_num, 2)
        self.play(Write(stack_vars))
        
        # Create working rectangles
        rect1 = Rectangle(height=rect_height, width=0.6*len(first_num))
        rect1.set_fill(BLUE, opacity=0.3)
        rect1.move_to([start_x, 0, 0])
        num1 = Text(first_num, font_size=30).move_to(rect1.get_center())
        var1_label = Text("first_num", font_size=20).next_to(rect1, UP, buff=0.2)
        
        rect2 = Rectangle(height=rect_height, width=0.6*len(second_num))
        rect2.set_fill(GREEN, opacity=0.3)
        rect2.next_to(rect1, RIGHT, buff=0.2)
        num2 = Text(second_num, font_size=30).move_to(rect2.get_center())
        var2_label = Text("second_num", font_size=20).next_to(rect2, UP, buff=0.2)
        
        initial_group = VGroup(rect1, rect2)
        initial_group.move_to(ORIGIN)
        
        self.play(
            Create(rect1),
            Create(rect2),
            Write(num1),
            Write(num2),
            Write(var1_label),
            Write(var2_label)
        )
        
        current_pos = 2
        while current_pos < len(example):
            sum_val = str(int(first_num) + int(second_num))
            
            # Update stack visualization (only update numbers)
            new_stack_vars = update_stack_vars(first_num, second_num, current_pos)
            self.play(Transform(stack_vars, new_stack_vars))
            
            rect_sum = Rectangle(height=rect_height, width=0.6*len(sum_val))
            rect_sum.set_fill(RED, opacity=0.3)
            rect_sum.next_to(VGroup(rect1, rect2), DOWN, buff=0.5)
            sum_text = Text(sum_val, font_size=30).move_to(rect_sum.get_center())
            sum_label = Text("sum", font_size=20).next_to(rect_sum, UP, buff=0.2)
            
            self.play(
                Create(rect_sum),
                Write(sum_text),
                Write(sum_label)
            )
            
            self.play(
                FadeOut(num1),
                FadeOut(sum_label),
                rect2.animate.move_to(rect1.get_center()),
                num2.animate.move_to(rect1.get_center()),
                var2_label.animate.move_to(var1_label.get_center()),
                rect_sum.animate.move_to(rect2.get_center()),
                sum_text.animate.move_to(rect2.get_center())
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
            
            # Highlight current position in array
            self.play(
                array_boxes[current_pos-1].animate.set_fill(YELLOW, opacity=0.3)
            )
        
        success = Text("Valid Additive Sequence!", color=GREEN, font_size=36)
        success.next_to(VGroup(rect1, rect2), DOWN, buff=1)
        self.play(Write(success))
        
        self.wait(2)

scene = AdditiveNumberVisualization()
scene.render()
