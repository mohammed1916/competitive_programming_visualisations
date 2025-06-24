from manim import *

class AdditiveNumberVisualization(Scene):
    def construct(self):
        # Title
        title = Text("Additive Number Sequence Checker", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        
        # Example string
        example = "112358"
        string_text = Text(f"Input: {example}", font_size=36).next_to(title, DOWN, buff=0.5)
        self.play(Write(string_text))
        
        # Create rectangles for numbers
        rect_height = 0.75
        rects = []
        numbers = []
        start_x = -5
        
        # Initial setup with first two numbers
        first_num = "1"
        second_num = "1"
        
        # First number rectangle
        rect1 = Rectangle(height=rect_height, width=0.6*len(first_num))
        rect1.set_fill(BLUE, opacity=0.3)
        rect1.move_to([start_x, 0, 0])
        num1 = Text(first_num, font_size=30).move_to(rect1.get_center())
        
        # Second number rectangle
        rect2 = Rectangle(height=rect_height, width=0.6*len(second_num))
        rect2.set_fill(GREEN, opacity=0.3)
        rect2.next_to(rect1, RIGHT, buff=0.2)
        num2 = Text(second_num, font_size=30).move_to(rect2.get_center())
        
        self.play(
            Create(rect1),
            Create(rect2),
            Write(num1),
            Write(num2)
        )
        
        # Animation for showing the addition process
        current_pos = 2
        while current_pos < len(example):
            sum_val = str(int(first_num) + int(second_num))
            
            # Create sum rectangle
            rect_sum = Rectangle(height=rect_height, width=0.6*len(sum_val))
            rect_sum.set_fill(RED, opacity=0.3)
            rect_sum.next_to(VGroup(rect1, rect2), DOWN, buff=0.5)
            sum_text = Text(sum_val, font_size=30).move_to(rect_sum.get_center())
            
            # Show addition
            self.play(
                Create(rect_sum),
                Write(sum_text)
            )
            
            # Move sum up and shift previous numbers left
            self.play(
                FadeOut(rect1),
                FadeOut(num1),
                rect2.animate.move_to(rect1.get_center()),
                num2.animate.move_to(rect1.get_center()),
                rect_sum.animate.move_to(rect2.get_center()),
                sum_text.animate.move_to(rect2.get_center())
            )
            
            # Update values for next iteration
            first_num = second_num
            second_num = sum_val
            rect1 = rect2
            num1 = num2
            rect2 = rect_sum
            num2 = sum_text
            current_pos += len(sum_val)
        
        # Show success message
        success = Text("Valid Additive Sequence!", color=GREEN, font_size=36)
        success.next_to(VGroup(rect1, rect2), DOWN, buff=1)
        self.play(Write(success))
        
        self.wait(2)

scene = AdditiveNumberVisualization()
scene.render()