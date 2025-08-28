from manim import *
import numpy as np
config.max_files_cached =150
class AdditiveNumberVisualization(Scene):
    def construct(self):
        # Example input string
        # numeric_string = "112358"  # Fibonacci sequence: 1+1=2, 1+2=3, 2+3=5, 3+5=8
        numeric_string = "112334"  
        
        # Title
        title = Text("Additive Number Algorithm Visualization", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))
        Def = VGroup(
            Text("Each number (starting from the third) is the sum of the previous two numbers.", font_size=14, color=WHITE),
            Text("Conditions:", font_size=32, color=BLUE).set_underline(True),
            Text("1. The sequence must have at least three numbers.", font_size=24, color=YELLOW),
            Text("2. Numbers can't have leading zeros, unless the number is exactly '0'.", font_size=24, color=YELLOW),
            Text("3. The string must be fully consumed by valid sums.", font_size=24, color=YELLOW)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        Def.to_edge(LEFT).shift(DOWN * 0.5)
        self.play(Write(Def))
        self.wait(5)
        self.play(FadeOut(Def))
        
        
        # Input string display
        input_text = Text(f"Input: {numeric_string}", font_size=24)
        input_text.next_to(title, DOWN, buff=2)
        self.play(Write(input_text))
        self.wait(1)
        
        # Hide input text to avoid overlap
        self.play(FadeOut(input_text))
        self.play(FadeOut(title))
        
        # Create string visualization
        string_boxes = VGroup()
        string_labels = VGroup()
        
        for i, char in enumerate(numeric_string):
            box = Square(side_length=0.8, color=WHITE)
            box.shift(RIGHT * (i - len(numeric_string)/2 + 0.5) * 1.5)
            label = Text(char, font_size=20)
            label.move_to(box.get_center())
            string_boxes.add(box)
            string_labels.add(label)
        
        string_group = VGroup(string_boxes, string_labels)
        string_group.shift(UP * 1.5)  # Move up a bit more since input is hidden
        
        self.play(Create(string_boxes), Write(string_labels))
        
        # Index labels
        index_labels = VGroup()
        for i in range(len(numeric_string)):
            index_label = Text(str(i), font_size=16, color=GRAY)
            index_label.next_to(string_boxes[i], DOWN, buff=0.1)
            index_labels.add(index_label)
        
        self.play(Write(index_labels))
        
        # Create animated arrows/pointers for flags
        arrow1 = Arrow(start=UP*0.3, end=DOWN*0.3, color=RED, buff=0.1)
        arrow2 = Arrow(start=UP*0.7, end=DOWN*0.3, color=BLUE, buff=0.1)
        arrow3 = Arrow(start=UP*0.5, end=DOWN*0.5, color=GREEN, buff=0.1)
        
        # Position arrows above the string - current_pos arrow higher for visibility
        arrow1.next_to(string_boxes[0], UP, buff=0.3)
        arrow2.next_to(string_boxes[1], UP, buff=0.5)
        arrow3.next_to(string_boxes[1], UP, buff=0.7)  # Higher position for current_pos
        
        # Arrow labels
        arrow1_label = Text("If first subproblem's\nFirst number ended here", font_size=12, color=RED)
        arrow2_label = Text("If first subproblem's\nSecond number ended here", font_size=12, color=BLUE)
        arrow3_label = Text("current_pos", font_size=12, color=GREEN)
        
        arrow1_label.next_to(arrow1, UP, buff=0.3)
        arrow2_label.next_to(arrow2, UP, buff=0.1)
        arrow3_label.next_to(arrow3, UP, buff=0.1)
        
        # Initially hide arrows
        arrows_group = VGroup(arrow1, arrow2, arrow3)
        labels_group = VGroup(arrow1_label, arrow2_label, arrow3_label)
        
        # Flag indicators
        flag_display = VGroup()
        
        # Create flag text displays
        flag1_text = Text("end_index_of_first_number: -", font_size=18, color=RED)
        flag2_text = Text("end_index_of_second_number: -", font_size=18, color=BLUE) 
        # flag3_text = Text("current_position_in_numeric_string: -", font_size=18, color=GREEN)
        
        flag1_text.to_edge(LEFT).shift(DOWN * 0.5)
        flag2_text.next_to(flag1_text, DOWN, buff=0.2)
        # flag3_text.next_to(flag2_text, DOWN, buff=0.2)
        
        # flag_display.add(flag1_text, flag2_text, flag3_text)
        flag_display.add(flag1_text, flag2_text)
        self.play(Write(flag_display))
        
        # Function to create braces with labels
        def create_brace_with_label(start_idx, end_idx, label_text, color, direction_=DOWN):
            if start_idx >= end_idx:
                return VGroup()
            
            boxes_to_brace = string_boxes[start_idx:end_idx]
            if len(boxes_to_brace) == 0:
                return VGroup()
                
            brace = Brace(boxes_to_brace, direction=direction_, color=color)
            brace_label = Text(label_text, font_size=14, color=color)
            
            if np.allclose(direction_, DOWN):
                brace_label.next_to(brace, DOWN, buff=0.1)
            else:
                brace_label.next_to(brace, UP, buff=0.1)
                
            return VGroup(brace, brace_label)
        
        # Stack/Heap display
        stack_title = Text("Operations", font_size=20, color=YELLOW)
        stack_title.to_edge(RIGHT).shift(LEFT * 2)
        
        stack_content = VGroup()
        stack_bg = Rectangle(width=3, height=1.5, color=YELLOW, fill_opacity=0.1)
        stack_bg.next_to(stack_title, DOWN, buff=0.3)
        
        self.play(Write(stack_title), Create(stack_bg))
        
        # Algorithm simulation
        total_length = len(numeric_string)
        
        # Initialize brace groups
        current_braces = VGroup()
        
        # Outer loop: end_index_of_first_number
        for end_idx_first in range(1, total_length):
            # Update flag display
            new_flag1 = Text(f"end_index_of_first_number: {end_idx_first}", font_size=18, color=RED)
            new_flag1.move_to(flag1_text.get_center())
            self.play(Transform(flag1_text, new_flag1))
            
            # Animate arrow1 to current position (pointing to end of first number)
            new_arrow1_pos = string_boxes[end_idx_first-1].get_center() + UP * 1.1
            new_label1_pos = new_arrow1_pos + UP * 0.6
            
            if end_idx_first == 1:  # First time showing arrow
                arrow1.next_to(string_boxes[end_idx_first-1], UP, buff=0.3)
                arrow1_label.next_to(arrow1, UP, buff=0.1)
                self.play(GrowArrow(arrow1), Write(arrow1_label))
            else:
                target_arrow1 = arrow1.copy().next_to(string_boxes[end_idx_first-1], UP, buff=0.3)
                target_label1 = arrow1_label.copy().next_to(target_arrow1, UP, buff=0.1)
                self.play(Transform(arrow1, target_arrow1), Transform(arrow1_label, target_label1))
            
            # Clear previous braces
            if len(current_braces) > 0:
                self.play(FadeOut(current_braces))
            
            # Create brace for first number
            first_brace = create_brace_with_label(0, end_idx_first, f"first\nnumber", RED, DOWN)
            current_braces = VGroup(first_brace)
            self.play(Create(first_brace))
            
            # Check leading zero condition
            if numeric_string[0] == '0' and end_idx_first > 1:
                break_text = Text("Breaking: Leading zero in first number", font_size=16, color=RED)
                break_text.next_to(stack_bg, DOWN, buff=0.2)
                self.play(Write(break_text))
                self.wait(1)
                self.play(FadeOut(break_text))
                break
            
            # Inner loop: end_index_of_second_number  
            for end_idx_second in range(end_idx_first + 1, total_length):
                # Update flag display
                new_flag2 = Text(f"end_index_of_second_number: {end_idx_second}", font_size=18, color=BLUE)
                new_flag2.move_to(flag2_text.get_center())
                self.play(Transform(flag2_text, new_flag2))
                
                # Animate arrow2 to current position (pointing to end of second number)
                if end_idx_first == 1 and end_idx_second == 2:  # First time showing arrow2
                    arrow2.next_to(string_boxes[end_idx_second-1], UP, buff=0.3)
                    arrow2_label.next_to(arrow2, UP, buff=0.1)
                    self.play(GrowArrow(arrow2), Write(arrow2_label))
                else:
                    target_arrow2 = arrow2.copy().next_to(string_boxes[end_idx_second-1], UP, buff=0.3)
                    target_label2 = arrow2_label.copy().next_to(target_arrow2, UP, buff=0.1)
                    self.play(Transform(arrow2, target_arrow2), Transform(arrow2_label, target_label2))
                
                # Update braces - remove old second brace if exists
                if len(current_braces) >= 1:
                    self.play(FadeOut(current_braces))
                    current_braces = VGroup()
                # Create brace for second number
                first_brace = create_brace_with_label(0, end_idx_first, f"first", RED, DOWN)
                current_braces.add(first_brace)
                self.play(Create(first_brace))
                second_brace = create_brace_with_label(end_idx_first, end_idx_second, f"second", BLUE, DOWN)
                current_braces.add(second_brace)
                self.play(Create(second_brace))
                
                # Check leading zero for second number
                if numeric_string[end_idx_first] == '0' and end_idx_second - end_idx_first > 1:
                    break_text = Text("Breaking: Leading zero in second number", font_size=16, color=BLUE)
                    break_text.next_to(stack_bg, DOWN, buff=0.2)
                    self.play(Write(break_text))
                    self.wait(1)
                    self.play(FadeOut(break_text))
                    break
                
                # Extract numbers
                first_num_str = numeric_string[:end_idx_first]
                second_num_str = numeric_string[end_idx_first:end_idx_second]
                current_pos = end_idx_second
                
                # Show arrow3 for current position (higher position for visibility)
                if end_idx_first == 1 and end_idx_second == 2:  # First time showing arrow3
                    arrow3.next_to(string_boxes[current_pos-1], UP, buff=0.7)
                    arrow3_label.next_to(arrow3, UP, buff=0.1)
                    self.play(GrowArrow(arrow3), Write(arrow3_label))
                else:
                    target_arrow3 = arrow3.copy().next_to(string_boxes[current_pos-1], UP, buff=0.7)
                    target_label3 = arrow3_label.copy().next_to(target_arrow3, UP, buff=0.1)
                    self.play(Transform(arrow3, target_arrow3), Transform(arrow3_label, target_label3))
                
                # Update stack/heap display
                stack_vars = VGroup()
                var1 = Text(f"first_num: '{first_num_str}'", font_size=14, color=WHITE)
                var2 = Text(f"second_num: '{second_num_str}'", font_size=14, color=WHITE)
                var3 = Text(f"current_pos: {current_pos}", font_size=14, color=WHITE)
                
                var1.next_to(stack_bg.get_top(), DOWN, buff=0.1)
                var2.next_to(var1, DOWN, buff=0.1)
                var3.next_to(var2, DOWN, buff=0.1)
                
                stack_vars.add(var1, var2, var3)
                self.play(Write(stack_vars))
                
                # Update current position flag
                # new_flag3 = Text(f"current_position_in_numeric_string: {current_pos}", font_size=18, color=GREEN)
                # new_flag3.move_to(flag3_text.get_center())
                # self.play(Transform(flag3_text, new_flag3))
                
                # While loop simulation
                sequence_valid = True
                first_num = first_num_str
                second_num = second_num_str
                sum_brace = VGroup()  # To track sum brace
                
                while current_pos < total_length:
                    # Calculate sum
                    sum_val = str(int(first_num) + int(second_num))
                    
                    # Update stack display
                    sum_text = Text(f"sum: '{sum_val}'", font_size=14, color=YELLOW)
                    sum_text.next_to(var3, DOWN, buff=0.1)
                    self.play(Write(sum_text))
                    
                    # Check if sum matches next part of string
                    if not numeric_string.startswith(sum_val, current_pos):
                        sequence_valid = False
                        error_text = Text("Sum doesn't match!", font_size=16, color=RED)
                        error_text.next_to(stack_bg, DOWN, buff=0.2)
                        self.play(Write(error_text))
                        self.wait(1)
                        self.play(FadeOut(error_text), FadeOut(sum_text))
                        break
                    
                    # Remove old sum brace if exists
                    if len(sum_brace) > 0:
                        self.play(FadeOut(sum_brace))
                    
                    # Create brace for sum
                    sum_end_pos = current_pos + len(sum_val)
                    sum_brace = create_brace_with_label(current_pos, sum_end_pos, f"sum='{sum_val}'", YELLOW, UP)
                    self.play(Create(sum_brace))
                    
                    # Animate arrow3 to new position after consuming sum
                    old_pos = current_pos - len(sum_val)  # Position before update
                    current_pos += len(sum_val)
                    
                    # Always move arrow3 to show the progression
                    if current_pos <= len(string_boxes):
                        if current_pos == len(string_boxes):
                            # Point to end of string (after last character)
                            target_arrow3 = arrow3.copy()
                            target_arrow3.next_to(string_boxes[-1], RIGHT, buff=0.1).shift(UP * 0.4)
                            target_label3 = arrow3_label.copy().next_to(target_arrow3, UP, buff=0.1)
                        else:
                            # Point to current position
                            target_arrow3 = arrow3.copy().next_to(string_boxes[current_pos-1], UP, buff=0.7)
                            target_label3 = arrow3_label.copy().next_to(target_arrow3, UP, buff=0.1)
                        
                        self.play(Transform(arrow3, target_arrow3), Transform(arrow3_label, target_label3))
                    
                    # Update variables
                    first_num = second_num
                    second_num = sum_val
                    self.play(
                        Transform(current_braces[0], create_brace_with_label(current_pos - len(first_num) - len(second_num), current_pos - len(second_num), f"first", RED, DOWN)),
                        Transform(current_braces[1], create_brace_with_label(current_pos - len(second_num), current_pos, f"second", BLUE, DOWN))
                    )
                    
                    # Update displays
                    new_var1 = Text(f"first_num: '{first_num}'", font_size=14, color=WHITE)
                    new_var2 = Text(f"second_num: '{second_num}'", font_size=14, color=WHITE)
                    new_var3 = Text(f"current_pos: {current_pos}", font_size=14, color=WHITE)
                    
                    new_var1.move_to(var1.get_center())
                    new_var2.move_to(var2.get_center())
                    new_var3.move_to(var3.get_center())
                    
                    self.play(
                        Transform(var1, new_var1),
                        Transform(var2, new_var2), 
                        Transform(var3, new_var3),
                        FadeOut(sum_text)
                    )
                    
                    # Update flag
                    # new_flag3 = Text(f"current_position_in_numeric_string: {current_pos}", font_size=18, color=GREEN)
                    # new_flag3.move_to(flag3_text.get_center())
                    # self.play(Transform(flag3_text, new_flag3))
                    
                    self.wait(0.5)
                
                # Check if we've consumed the entire string
                if current_pos == total_length and sequence_valid:
                    success_text = Text("SUCCESS! \nValid additive sequence found!", 
                                      font_size=20, color=GREEN)
                    success_text.next_to(flag2_text, DOWN + RIGHT, buff=0.5)
                    self.play(Write(success_text))
                    
                    # Highlight the complete sequence with final braces
                    if len(sum_brace) > 0:
                        self.play(sum_brace.animate.set_color(GREEN))
                    self.play(current_braces.animate.set_color(GREEN))
                    
                    self.wait(3)
                    return
                
                # Clear stack and braces for next iteration
                self.play(FadeOut(stack_vars))
                if len(sum_brace) > 0:
                    self.play(FadeOut(sum_brace))
                
                self.wait(0.5)
            
            # Clear first number brace before next iteration
            if len(current_braces) > 0:
                self.play(FadeOut(current_braces))
                current_braces = VGroup()
        
        # If we get here, no valid sequence was found
        failure_text = Text("No valid additive sequence found", font_size=20, color=RED)
        failure_text.next_to(flag2_text, DOWN + RIGHT, buff=0.5)  
        self.play(Write(failure_text))
        
        # Hide arrows
        self.play(FadeOut(arrows_group), FadeOut(labels_group))
        self.wait(2)

# # Alternative example with a non-additive sequence
# class AdditiveNumberFailureExample(Scene):
#     def construct(self):
#         # This will demonstrate the algorithm failing
#         numeric_string = "123"  # Not an additive sequence
        
#         title = Text("Non-Additive Example: '123'", font_size=36)
#         self.play(Write(title))
        
#         explanation = Text("1+2=3, but we need at least 3 numbers in sequence", 
#                          font_size=18, color=YELLOW)
#         explanation.next_to(title, DOWN)
#         self.play(Write(explanation))
        
#         self.wait(3)