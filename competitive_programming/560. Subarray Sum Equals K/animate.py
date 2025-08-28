from manim import (
    Scene, VGroup, RoundedRectangle, Text, Rectangle, Mobject, Transform, FadeIn,
    Indicate, Arrow, GrowArrow, FadeOut, Wiggle, DOWN, UP, LEFT, RIGHT, Create,
    Write, BraceBetweenPoints, ORIGIN
)
from typing import List, Dict


class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        res = 0
        prefix_sums_until_now_freq = {0: 1}
        prefix_sum_now = 0
        for val in nums:
            prefix_sum_now += val
            prev_prefix_needed = prefix_sum_now - k
            res += prefix_sums_until_now_freq.get(prev_prefix_needed, 0)
            prefix_sums_until_now_freq[prefix_sum_now] = (
                1 + prefix_sums_until_now_freq.get(prefix_sum_now, 0)
            )
        return res


# ------------------ FONT SIZE CONFIG ------------------
FONT_SIZE_TITLE = int(44 * 0.8)
FONT_SIZE_SUBTITLE = int(26 * 0.8)
FONT_SIZE_PANEL_TITLE = int(28 * 0.8)
FONT_SIZE_INPUT = int(28 * 0.8)
FONT_SIZE_ARRAY_LABEL = int(30 * 0.8)
FONT_SIZE_INDEX_LABEL = int(24 * 0.8)
FONT_SIZE_DICT_KEY = int(26 * 0.8)
FONT_SIZE_DICT_VAL = int(26 * 0.8)
FONT_SIZE_VAR_LINE = int(30 * 0.8)
FONT_SIZE_DETAILED_LABEL = int(26 * 0.8)
FONT_SIZE_DETAILED_FINAL = int(34 * 0.8)
FONT_SIZE_QUICK_TITLE = int(42 * 0.8)
FONT_SIZE_QUICK_INPUT = int(30 * 0.8)
FONT_SIZE_QUICK_ANS = int(34 * 0.8)

# ---------- Optional color theme ----------
THEME_BG = "#0b1021"
THEME_PANEL_BG = "#151c3b"
THEME_ACCENT = "#7aa2f7"
THEME_GOOD = "#9ece6a"
THEME_WARN = "#e0af68"
THEME_BAD = "#f7768e"
THEME_TEXT = "#c0caf5"
THEME_MUTED = "#9aa5ce"
THEME_CYAN = "#7dcfff"


# ---------- Helper Components ----------
class Panel(VGroup):
    def __init__(self, title: str, width: float = 6.5, height: float = 3.5,
                 corner_radius: float = 0.2, **kwargs):
        super().__init__(**kwargs)
        self.bg = RoundedRectangle(
            width=width, height=height, corner_radius=corner_radius,
            stroke_color=THEME_ACCENT, fill_color=THEME_PANEL_BG,
            fill_opacity=0.6, stroke_width=2
        )
        self.title = Text(title, font_size=FONT_SIZE_PANEL_TITLE, color=THEME_TEXT)
        self.title.align_to(self.bg.get_top(), UP)
        self.title.shift(LEFT * (width / 2 - 0.3) + DOWN * 0.35)
        self.add(self.bg, self.title)

    def add_body(self, *mob: Mobject):
        for m in mob:
            self.add(m)
        return self


class KeyValueRow(VGroup):
    def __init__(self, key: str, value: str,
                 key_w: float = 3.2, val_w: float = 6.2, **kwargs):
        super().__init__(**kwargs)
        self.key_text = Text(key, font_size=FONT_SIZE_DICT_KEY, color=THEME_MUTED)
        self.val_text = Text(value, font_size=FONT_SIZE_DICT_VAL, color=THEME_TEXT)
        self.key_box = Rectangle(width=key_w, height=self.key_text.height + 0.2,
                                 stroke_color=THEME_ACCENT, fill_opacity=0.05)
        self.val_box = Rectangle(width=val_w, height=self.val_text.height + 0.2,
                                 stroke_color=THEME_ACCENT, fill_opacity=0.05)
        self.key_text.move_to(self.key_box.get_center())
        self.val_text.move_to(self.val_box.get_center())
        self.group = VGroup(self.key_box, self.val_box).arrange(RIGHT, buff=0.15)
        self.add(self.group, self.key_text, self.val_text)

    def update_value(self, new_value: str):
        new_val = Text(new_value, font_size=self.val_text.font_size, color=THEME_TEXT)
        new_val.move_to(self.val_text.get_center())
        return Transform(self.val_text, new_val)


class DictPanel(VGroup):
    def __init__(self, title: str = "prefix_sums_until_now_freq",
                 max_rows: int = 6, width: float = 7.6, **kwargs):
        super().__init__(**kwargs)
        self.panel = Panel(title=title, width=width, height=4.6)
        self.max_rows = max_rows
        self.content = VGroup()
        self.content.next_to(self.panel.title, DOWN, buff=0.4)
        self.add(self.panel, self.content)

    def set_pairs(self, pairs: Dict[int, int]):
        self.content.submobjects = []
        for idx, (k, v) in enumerate(sorted(pairs.items(), key=lambda kv: kv[0])[:self.max_rows]):
            row = KeyValueRow(key=str(k), value=str(v))
            if idx == 0:
                row.group.align_to(self.panel.bg.get_left(), LEFT).shift(RIGHT * 0.35)
            self.content.add(row)
        self.content.arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        self.content.move_to(self.panel.bg.get_center()).shift(UP * 0.15 + LEFT * 0.1)
        return self


class ArrayBar(VGroup):
    def __init__(self, nums: List[int], box_size: float = 0.9,
                 hgap: float = 0.2, **kwargs):
        super().__init__(**kwargs)
        self.boxes = VGroup()
        self.labels = VGroup()
        self.nums = nums
        for v in nums:
            rect = RoundedRectangle(width=box_size * 1.4, height=box_size,
                                    corner_radius=0.12,
                                    stroke_color=THEME_ACCENT,
                                    fill_color=THEME_PANEL_BG,
                                    fill_opacity=0.6, stroke_width=2)
            self.boxes.add(rect)
            label = Text(str(v), font_size=FONT_SIZE_ARRAY_LABEL, color=THEME_TEXT)
            self.labels.add(label)
        self.boxes.arrange(RIGHT, buff=hgap)
        for box, lbl in zip(self.boxes, self.labels):
            lbl.move_to(box.get_center())
        self.arrow = Arrow(UP, DOWN, buff=0.1, color=THEME_CYAN)
        self.index_label = Text("j", font_size=FONT_SIZE_INDEX_LABEL, color=THEME_CYAN)
        self.add(self.boxes, self.labels)

    def at_index(self, j: int):
        return self.boxes[j]

    def create_arrow(self, scene: Scene, j: int, buff: float = 0.25):
        self.arrow.next_to(self.at_index(j), UP, buff=buff)
        self.index_label.next_to(self.arrow, UP, buff=0.1)
        return [GrowArrow(self.arrow), FadeIn(self.index_label)]

    def move_arrow_to(self, j: int, buff: float = 0.25):
        return [self.arrow.animate.next_to(self.at_index(j), UP, buff=buff),
                self.index_label.animate.next_to(self.arrow, UP, buff=0.1)]

    def highlight_box(self, j: int, color=THEME_CYAN):
        return Indicate(self.at_index(j), color=color)


class VarLine(VGroup):
    def __init__(self, label: str, value: str, color=THEME_TEXT):
        super().__init__()
        self.label_text = Text(label, font_size=FONT_SIZE_VAR_LINE, color=THEME_MUTED)
        self.value_text = Text(value, font_size=FONT_SIZE_VAR_LINE, color=color)
        eq = Text(" = ", font_size=FONT_SIZE_VAR_LINE, color=THEME_MUTED)
        self.group = VGroup(self.label_text, eq, self.value_text).arrange(RIGHT, buff=0.2)
        self.add(self.group)

    def update_value(self, new_value: str):
        return Transform(self.value_text, Text(new_value, font_size=self.value_text.font_size, color=self.value_text.color))


# =============================================================
# Full Visualizer Scene
class SubarraySumKVisualization(Scene):
    NUMS: List[int] = [1, 2, 3, -1, 1, 2]
    K: int = 3

    def construct(self):
        # self.camera.frame.set_background(THEME_BG)

        title = Text("Subarray Sum = k – Detailed", font_size=FONT_SIZE_TITLE, color=THEME_TEXT)
        subtitle = Text("Highlighting matching subarrays", font_size=FONT_SIZE_SUBTITLE, color=THEME_MUTED)
        header = VGroup(title, subtitle).arrange(DOWN, buff=0.25).to_edge(UP).shift(DOWN * 0.4)
        self.play(Write(header))

        arr = ArrayBar(self.NUMS)
        arr.move_to(ORIGIN).shift(UP * 1.0)
        self.play(Create(arr.boxes), Write(arr.labels))
        self.play(*arr.create_arrow(self, 0))

        left_panel = Panel("Vars", width=7.0, height=3.4).to_edge(LEFT).shift(RIGHT * 0.8 + DOWN * 0.4)
        right_panel = DictPanel(width=7.6).to_edge(RIGHT).shift(LEFT * 0.6 + DOWN * 0.2)
        self.play(FadeIn(left_panel), FadeIn(right_panel))

        res_line = VarLine("res", "0", color=THEME_GOOD)
        ps_line = VarLine("prefix_sum_now", "0", color=THEME_ACCENT)
        need_line = VarLine("prev_prefix_needed", "—", color=THEME_TEXT)
        vars_group = VGroup(res_line, ps_line, need_line).arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        vars_group.move_to(left_panel.bg.get_center()).shift(LEFT * 1.4)
        left_panel.add_body(res_line, ps_line, need_line)

        freq = {0: 1}
        right_panel.set_pairs(freq)
        prefix_values = [0]
        prefix_sum_now = 0
        res = 0

        def brace_subarray(l: int, r: int, color=THEME_GOOD):
            left_box = arr.at_index(l)
            right_box = arr.at_index(r)
            brace = BraceBetweenPoints(
                left_box.get_bottom() + DOWN * 0.05,
                right_box.get_bottom() + DOWN * 0.05,
                color=color
            )
            label = Text(f"sum = {self.K}", font_size=FONT_SIZE_DETAILED_LABEL, color=color)
            label.next_to(brace, DOWN, buff=0.1)
            return VGroup(brace, label)

        for j, x in enumerate(self.NUMS):
            self.play(*arr.move_arrow_to(j), arr.highlight_box(j, color=THEME_CYAN))

            prefix_sum_now += x
            self.play(ps_line.update_value(str(prefix_sum_now)))

            prev_prefix_needed = prefix_sum_now - self.K
            self.play(need_line.update_value(str(prev_prefix_needed)))

            matches = [i for i, p in enumerate(prefix_values) if p == prev_prefix_needed]
            if matches:
                for i in matches:
                    brace_grp = brace_subarray(i, j)
                    self.play(Create(brace_grp[0]), FadeIn(brace_grp[1]))
                    self.play(Indicate(VGroup(*[arr.boxes[k] for k in range(i, j + 1)]), color=THEME_GOOD))
                    res += 1
                    self.play(res_line.update_value(str(res)))
                    self.wait(0.2)
                    self.play(FadeOut(brace_grp))
            else:
                self.play(Wiggle(res_line, scale_value=1.02, rotation_angle=0.02))

            freq[prefix_sum_now] = 1 + freq.get(prefix_sum_now, 0)
            right_panel.set_pairs(freq)
            prefix_values.append(prefix_sum_now)
            self.wait(0.2)

        final = Text(f"Total subarrays with sum {self.K}: {res}", font_size=FONT_SIZE_DETAILED_FINAL, color=THEME_GOOD)
        final.next_to(arr, DOWN, buff=0.8)
        self.play(Write(final))
        self.wait(1.8)


# -------------------------------------------------------------
# Optional Quick Check Scene
class SubarraySumKQuickCheck(Scene):
    NUMS: List[int] = [1, 2, 3, -1, 1, 2]
    K: int = 3

    def construct(self):
        # self.camera.frame.set_background(THEME_BG)

        title = Text("Quick Check", font_size=FONT_SIZE_QUICK_TITLE, color=THEME_TEXT).to_edge(UP)
        self.play(Write(title))

        nums_text = Text(f"nums = {self.NUMS}", font_size=FONT_SIZE_QUICK_INPUT, color=THEME_TEXT)
        k_text = Text(f"k = {self.K}", font_size=FONT_SIZE_QUICK_INPUT, color=THEME_TEXT)
        VGroup(nums_text, k_text).arrange(DOWN, buff=0.25).move_to(ORIGIN).shift(UP * 0.7)
        self.play(Write(nums_text), Write(k_text))

        sol = Solution()
        ans = sol.subarraySum(self.NUMS, self.K)
        ans_text = Text(f"Solution().subarraySum(nums, k) = {ans}", font_size=FONT_SIZE_QUICK_ANS, color=THEME_GOOD)
        ans_text.next_to(k_text, DOWN, buff=0.8)
        self.play(Write(ans_text))
        self.wait(1.5)
