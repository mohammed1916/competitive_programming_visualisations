from manim import *
from typing import List, Dict, Tuple

# =============================================================
# Manim: Subarray Sum = K (Prefix Sum + Hash Map) – Full Visualizer
# -------------------------------------------------------------
# This scene animates the classic algorithm that counts subarrays
# whose sum equals a target k using prefix sums and a frequency map.
#
# Render (16:9 Full HD):
#   manim -pqh subarray_sum_visualizer.py SubarraySumKVisualization --resolution=1920,1080
# Or Medium quality for speed:
#   manim -pqm subarray_sum_visualizer.py SubarraySumKVisualization --resolution=1920,1080
#
# You can tweak NUMS and K in the Scene's config section.
# =============================================================

# ---------- Optional color theme ----------
THEME_BG          = "#0b1021"
THEME_PANEL_BG    = "#151c3b"
THEME_ACCENT      = "#7aa2f7"  # blue
THEME_GOOD        = "#9ece6a"  # green
THEME_WARN        = "#e0af68"  # yellow
THEME_BAD         = "#f7768e"  # red
THEME_TEXT        = "#c0caf5"  # light text
THEME_MUTED       = "#9aa5ce"  # dim text
THEME_PURPLE      = "#bb9af7"
THEME_CYAN        = "#7dcfff"

# ---------- Helper components ----------
class Panel(VGroup):
    """A rounded rectangle panel with a title text at the top-left."""
    def __init__(self, title: str, width: float = 6.5, height: float = 3.5,
                 title_size: int = 28, corner_radius: float = 0.2, **kwargs):
        super().__init__(**kwargs)
        self.bg = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=corner_radius,
            stroke_color=THEME_ACCENT,
            fill_color=THEME_PANEL_BG,
            fill_opacity=0.6,
            stroke_width=2,
        )
        self.title = Text(title, font_size=title_size, color=THEME_TEXT).align_to(self.bg.get_top(), UP)
        self.title.shift(LEFT * (self.bg.width / 2 - 0.3) + DOWN * 0.35)
        self.add(self.bg, self.title)

    def add_body(self, *mobjects: Mobject):
        for m in mobjects:
            self.add(m)
        return self

class KeyValueRow(VGroup):
    """Displays a single key/value pair for dictionary-like panels."""
    def __init__(self, key: str, value: str, key_w: float = 3.2, val_w: float = 6.2,
                 font_size: int = 26, **kwargs):
        super().__init__(**kwargs)
        self.key_text = Text(str(key), font_size=font_size, color=THEME_MUTED)
        self.val_text = Text(str(value), font_size=font_size, color=THEME_TEXT)
        self.key_box = Rectangle(width=key_w, height=self.key_text.height + 0.2,
                                 stroke_color=THEME_ACCENT, fill_opacity=0.05)
        self.val_box = Rectangle(width=val_w, height=self.val_text.height + 0.2,
                                 stroke_color=THEME_ACCENT, fill_opacity=0.05)
        self.key_text.move_to(self.key_box.get_center())
        self.val_text.move_to(self.val_box.get_center())
        self.group = VGroup(self.key_box, self.val_box)
        self.group.arrange(RIGHT, buff=0.15)
        # align texts into boxes
        self.add(self.group, self.key_text, self.val_text)

    def update_value(self, new_value: str):
        new_val = Text(str(new_value), font_size=self.val_text.font_size, color=THEME_TEXT)
        new_val.move_to(self.val_text.get_center())
        return Transform(self.val_text, new_val)

class DictPanel(VGroup):
    """A small dictionary-like panel that shows prefix frequencies."""
    def __init__(self, title: str = "prefix_sums_until_now_freq",
                 max_rows: int = 6,
                 width: float = 7.6,
                 **kwargs):
        super().__init__(**kwargs)
        self.panel = Panel(title=title, width=width, height=4.6)
        self.rows: Dict[int, KeyValueRow] = {}
        self.max_rows = max_rows
        self.content_area = VGroup()
        self.content_area.next_to(self.panel.title, DOWN, buff=0.4)
        self.add(self.panel, self.content_area)

    def set_pairs(self, pairs: Dict[int, int]):
        # Clear and show top N by recent insert order
        self.content_area.submobjects = []   # <-- FIX: reset group
        # Sort keys for stable display (ascending prefix)
        for idx, (k, v) in enumerate(sorted(pairs.items(), key=lambda kv: kv[0])[: self.max_rows]):
            row = KeyValueRow(key=f"{k}", value=f"{v}")
            if idx == 0:
                row.group.align_to(self.panel.bg.get_left(), LEFT)
                row.group.shift(RIGHT * 0.35)
            self.content_area.add(row)
        self.content_area.arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        # ensure rows sit within panel
        self.content_area.move_to(self.panel.bg.get_center()).shift(UP * 0.15 + LEFT * 0.1)
        return self

    def upsert_pair(self, k: int, v: int, animate_ops=True):
        """Insert or update a row representing key k -> v."""
        # Try to find row with key text == k
        existing = None
        for r in self.content_area:
            if isinstance(r, KeyValueRow) and r.key_text.text == str(k):
                existing = r
                break
        if existing is not None:
            # Update
            anim = existing.update_value(str(v))
            return [anim]
        else:
            # Insert new row at correct sorted position
            new_row = KeyValueRow(key=f"{k}", value=f"{v}")
            # compute insertion index for sorted order
            keys = []
            for r in self.content_area:
                if isinstance(r, KeyValueRow):
                    keys.append(int(r.key_text.text))
            keys.append(k)
            keys_sorted = sorted(keys)
            insert_index = keys_sorted.index(k)
            # Insert visually
            if len(self.content_area) == 0:
                new_row.group.align_to(self.panel.bg.get_left(), LEFT)
                new_row.group.shift(RIGHT * 0.35)
                self.content_area.add(new_row)
                self.content_area.move_to(self.panel.bg.get_center()).shift(UP * 0.15 + LEFT * 0.1)
                if animate_ops:
                    return [FadeIn(new_row)]
                else:
                    return []
            else:
                # place at approximate y between neighbors
                self.content_area.add(new_row)
                self.content_area.arrange(DOWN, buff=0.2, aligned_edge=LEFT)
                self.content_area.move_to(self.panel.bg.get_center()).shift(UP * 0.15 + LEFT * 0.1)
                if animate_ops:
                    return [FadeIn(new_row)]
                else:
                    return []


class ArrayBar(VGroup):
    """Visual array with boxes and labels, plus a moving index arrow."""
    def __init__(self, nums: List[int], box_size: float = 0.9, hgap: float = 0.2, **kwargs):
        super().__init__(**kwargs)
        self.nums = nums
        self.boxes = VGroup()
        self.labels = VGroup()
        for v in nums:
            rect = RoundedRectangle(width=box_size*1.4, height=box_size,
                                    corner_radius=0.12,
                                    stroke_color=THEME_ACCENT,
                                    fill_color=THEME_PANEL_BG,
                                    fill_opacity=0.6,
                                    stroke_width=2)
            self.boxes.add(rect)
            label = Text(str(v), font_size=30, color=THEME_TEXT)
            self.labels.add(label)
        self.boxes.arrange(RIGHT, buff=hgap)
        for box, lbl in zip(self.boxes, self.labels):
            lbl.move_to(box.get_center())
        self.arrow = Arrow(UP, DOWN, buff=0.1, color=THEME_CYAN)
        self.index_label = Text("j", font_size=24, color=THEME_CYAN)
        self.add(self.boxes, self.labels)

    def at_index(self, j: int) -> Mobject:
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
    """Key variable line like: prefix_sum_now = 3."""
    def __init__(self, label: str, value: str, color=THEME_TEXT, font_size: int = 30):
        super().__init__()
        self.label_text = Text(label, font_size=font_size, color=THEME_MUTED)
        self.value_text = Text(str(value), font_size=font_size, color=color)
        eq = Text(" = ", font_size=font_size, color=THEME_MUTED)
        self.group = VGroup(self.label_text, eq, self.value_text).arrange(RIGHT, buff=0.2)
        self.add(self.group)

    def update_value(self, new_value: str):
        new = Text(str(new_value), font_size=self.value_text.font_size, color=self.value_text.color)
        new.move_to(self.value_text.get_center())
        return Transform(self.value_text, new)

# ---------- Core logic replicator (for correctness) ----------
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        res = 0
        prefix_sums_until_now_freq: Dict[int, int] = {0: 1}
        prefix_sum_now = 0
        for j in range(len(nums)):
            prefix_sum_now += nums[j]
            prev_prefix_needed = prefix_sum_now - k
            res += prefix_sums_until_now_freq.get(prev_prefix_needed, 0)
            prefix_sums_until_now_freq[prefix_sum_now] = 1 + prefix_sums_until_now_freq.get(prefix_sum_now, 0)
        return res

# ---------- Scene ----------
class SubarraySumKVisualization(Scene):
    """
    A comprehensive, YouTube-ready visualization of the subarraySum algorithm
    using prefix sums and a hash map of prefix frequencies.

    Adjust NUMS and K below to try different cases.
    """

    # ---- Configurable inputs ----
    NUMS: List[int] = [1, 2, 3, -1, 1, 2]
    K: int = 3

    def construct(self):
        # Background color
        self.camera.background_color = THEME_BG

        # Title
        title = Text("Subarray Sum = k (Prefix Sums + Hash Map)", font_size=44, color=THEME_TEXT)
        subtitle = Text("Counts subarrays whose sum equals k", font_size=26, color=THEME_MUTED)
        header = VGroup(title, subtitle).arrange(DOWN, buff=0.25)
        header.to_edge(UP).shift(DOWN * 0.4)
        self.play(Write(header))
        self.wait(0.4)

        # Input panel
        input_panel = Panel("Input", width=7.6, height=2.8)
        nums_line = Text(f"nums = {self.NUMS}", font_size=28, color=THEME_TEXT)
        k_line = Text(f"k = {self.K}", font_size=28, color=THEME_TEXT)
        VGroup(nums_line, k_line).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        nums_line.move_to(input_panel.bg.get_center()).shift(UP * 0.3 + LEFT * 2.2)
        k_line.next_to(nums_line, DOWN, buff=0.2, aligned_edge=LEFT)
        input_panel.add_body(nums_line, k_line)
        input_panel.to_edge(LEFT).shift(RIGHT * 0.7 + DOWN * 0.5)
        self.play(FadeIn(input_panel))

        # Array bar (center)
        arr = ArrayBar(self.NUMS)
        arr.move_to(ORIGIN).shift(UP * 0.6)
        self.play(Create(arr.boxes), Write(arr.labels))
        self.play(*arr.create_arrow(self, 0))

        # Right: dictionary panel
        dict_panel = DictPanel(title="prefix_sums_until_now_freq", width=7.6)
        dict_panel.set_pairs({0: 1})
        dict_panel.to_edge(RIGHT).shift(LEFT * 0.6 + DOWN * 0.2)
        self.play(FadeIn(dict_panel))

        # Bottom-left: variables panel
        vars_panel = Panel("Variables & Counters", width=7.6, height=3.6)
        vars_panel.to_edge(LEFT).shift(RIGHT * 0.7 + DOWN * 2.7)
        res_line = VarLine("res", "0", color=THEME_GOOD)
        ps_line = VarLine("prefix_sum_now", "0", color=THEME_ACCENT)
        need_line = VarLine("prev_prefix_needed", "—", color=THEME_TEXT)
        lines = VGroup(res_line, ps_line, need_line).arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        lines.move_to(vars_panel.bg.get_center()).shift(UP * 0.1 + LEFT * 1.6)
        vars_panel.add_body(lines)
        self.play(FadeIn(vars_panel))

        # Code panel (for reference)
        code_panel = Panel("Algorithm (reference)", width=14.5, height=4.6)
        code_panel.move_to(ORIGIN).shift(DOWN * 2.7)
        code_text = Code(
            code=(
                "res = 0\n"
                "prefix_sums_until_now_freq = {0:1}\n"
                "prefix_sum_now = 0\n"
                "for j in range(len(nums)):\n"
                "    prefix_sum_now += nums[j]\n"
                "    prev_prefix_needed = prefix_sum_now - k\n"
                "    res += prefix_sums_until_now_freq.get(prev_prefix_needed, 0)\n"
                "    prefix_sums_until_now_freq[prefix_sum_now] = 1 + prefix_sums_until_now_freq.get(prefix_sum_now, 0)\n"
            ),
            language="python", font_size=18, style="monokai", line_no_from=1,
            insert_line_no=False, tab_width=4,
        ).scale(0.95)
        code_text.move_to(code_panel.bg.get_center()).shift(DOWN * 0.05)
        code_panel.add_body(code_text)
        self.play(FadeIn(code_panel))

        # State for algorithm run
        prefix_sum_now = 0
        res = 0
        freq: Dict[int, int] = {0: 1}

        # Utility highlights inside code block
        code_lines = {
            "update_ps": 4,
            "need": 5,
            "add_res": 6,
            "update_freq": 7,
        }
        def highlight_line(n: int):
            return Indicate(code_text.code[n-1], color=THEME_CYAN, scale_factor=1.01)

        # Iterate algorithm
        for j, x in enumerate(self.NUMS):
            # Move arrow to j
            self.play(*arr.move_arrow_to(j))
            self.play(arr.highlight_box(j, color=THEME_CYAN))

            # prefix_sum_now += nums[j]
            self.play(highlight_line(code_lines["update_ps"]))
            old_ps = prefix_sum_now
            prefix_sum_now += x
            self.play(ps_line.update_value(str(prefix_sum_now)))

            # prev_prefix_needed = prefix_sum_now - k
            self.play(highlight_line(code_lines["need"]))
            prev_prefix_needed = prefix_sum_now - self.K
            self.play(need_line.update_value(str(prev_prefix_needed)))

            # res += freq.get(prev_prefix_needed, 0)
            self.play(highlight_line(code_lines["add_res"]))
            add_val = freq.get(prev_prefix_needed, 0)
            if add_val > 0:
                pulse = SurroundingRectangle(res_line, color=THEME_GOOD, buff=0.1)
                plus_lbl = Text(f"+{add_val}", font_size=28, color=THEME_GOOD)
                plus_lbl.next_to(res_line, RIGHT, buff=0.3)
                self.play(FadeIn(pulse), FadeIn(plus_lbl))
                res += add_val
                self.play(res_line.update_value(str(res)))
                self.play(FadeOut(pulse), FadeOut(plus_lbl))
            else:
                shake = Wiggle(res_line, scale_value=1.02, rotation_angle=0.02)
                self.play(shake)

            # freq[prefix_sum_now] = 1 + freq.get(prefix_sum_now, 0)
            self.play(highlight_line(code_lines["update_freq"]))
            freq[prefix_sum_now] = 1 + freq.get(prefix_sum_now, 0)
            # update dict panel (animated upsert)
            anims = dict_panel.upsert_pair(prefix_sum_now, freq[prefix_sum_now], animate_ops=True)
            self.play(*anims)

            # Update whole dict snapshot (for stability/visibility)
            dict_panel.set_pairs(freq)
            self.play(Flash(dict_panel.panel.title))
            self.wait(0.3)

        # Finished loop
        final_box = SurroundingRectangle(res_line, color=THEME_GOOD, buff=0.12)
        final_text = Text(f"Final Result: {res}", font_size=36, color=THEME_GOOD)
        final_text.next_to(code_panel, UP, buff=0.4)
        self.play(Create(final_box), Write(final_text))
        self.wait(0.6)

        # Quick correctness check using the class (optional demonstration)
        solver = Solution()
        expected = solver.subarraySum(self.NUMS, self.K)
        check_color = THEME_GOOD if expected == res else THEME_BAD
        check_text = Text(
            f"Check with Solution().subarraySum(nums, k) → {expected}",
            font_size=26, color=check_color
        )
        check_text.next_to(final_text, DOWN, buff=0.2)
        self.play(Write(check_text))
        if expected == res:
            self.play(Indicate(final_text, color=THEME_GOOD))
        else:
            self.play(Indicate(final_text, color=THEME_BAD))
        self.wait(1.2)

        # Outro
        outro = Text("Prefix sums + hashmap gives O(n) time, O(n) space.", font_size=26, color=THEME_MUTED)
        outro.next_to(check_text, DOWN, buff=0.35)
        self.play(FadeIn(outro))
        self.wait(1.8)

# -------------------------------------------------------------
# EXTRA: A more detailed, step-by-step variant with subarray highlights
#        (longer animation showing actual subarrays that add to k)
# -------------------------------------------------------------
class SubarraySumKDetailed(Scene):
    """
    A slower, more demonstrative version that highlights actual subarrays
    contributing to the result when a match is found via prev_prefix_needed.
    """

    NUMS: List[int] = [1, 2, 3, -1, 1, 2]
    K: int = 3

    def construct(self):
        self.camera.background_color = THEME_BG

        title = Text("Subarray Sum = k – Detailed", font_size=44, color=THEME_TEXT)
        subtitle = Text("Highlighting matching subarrays", font_size=26, color=THEME_MUTED)
        header = VGroup(title, subtitle).arrange(DOWN, buff=0.25)
        header.to_edge(UP).shift(DOWN * 0.4)
        self.play(Write(header))

        # Center array
        arr = ArrayBar(self.NUMS)
        arr.move_to(ORIGIN).shift(UP * 1.0)
        self.play(Create(arr.boxes), Write(arr.labels))
        self.play(*arr.create_arrow(self, 0))

        # Panels
        left = Panel("Vars", width=7.0, height=3.4).to_edge(LEFT).shift(RIGHT * 0.8 + DOWN * 0.4)
        right = DictPanel(title="prefix_sums_until_now_freq", width=7.6).to_edge(RIGHT).shift(LEFT * 0.6 + DOWN * 0.2)
        self.play(FadeIn(left), FadeIn(right))

        res_line = VarLine("res", "0", color=THEME_GOOD)
        ps_line = VarLine("prefix_sum_now", "0", color=THEME_ACCENT)
        need_line = VarLine("prev_prefix_needed", "—", color=THEME_TEXT)
        VGroup(res_line, ps_line, need_line).arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        VGroup(res_line, ps_line, need_line).move_to(left.bg.get_center()).shift(LEFT * 1.4)
        left.add_body(res_line, ps_line, need_line)

        # init state
        freq = {0: 1}
        right.set_pairs(freq)

        prefix_sum_now = 0
        res = 0

        # Utility to draw brace over subarray [l..r]
        def brace_subarray(l: int, r: int, color: str = THEME_GOOD):
            left_box = arr.at_index(l)
            right_box = arr.at_index(r)
            brace = BraceBetweenPoints(
                left_box.get_bottom() + DOWN * 0.05,
                right_box.get_bottom() + DOWN * 0.05,
                color=color
            )
            label = Text(f"sum = {self.K}", font_size=26, color=color)
            label.next_to(brace, DOWN, buff=0.1)
            return VGroup(brace, label)

        # Keep all computed prefix sums to help find subarrays visually
        # prefix[i] = sum of nums[0..i]
        prefix_values = [0]

        for j, x in enumerate(self.NUMS):
            self.play(*arr.move_arrow_to(j))
            self.play(arr.highlight_box(j, color=THEME_CYAN))

            prefix_sum_now += x
            self.play(ps_line.update_value(str(prefix_sum_now)))

            prev_prefix_needed = prefix_sum_now - self.K
            self.play(need_line.update_value(str(prev_prefix_needed)))

            add_val = freq.get(prev_prefix_needed, 0)
            if add_val > 0:
                # Find all indices i where prefix[i] == prev_prefix_needed
                matches = [i for i, p in enumerate(prefix_values) if p == prev_prefix_needed]
                # For each such i, subarray (i..j) sums to K
                for i in matches:
                    # Highlight subarray boxes
                    bracegrp = brace_subarray(i, j, color=THEME_GOOD)
                    self.play(Create(bracegrp[0]), FadeIn(bracegrp[1]))
                    self.play(Indicate(VGroup(*arr.boxes[i:j+1]), color=THEME_GOOD))
                    res += 1
                    self.play(res_line.update_value(str(res)))
                    self.wait(0.2)
                    self.play(FadeOut(bracegrp))
            else:
                self.play(Wiggle(res_line, scale_value=1.02, rotation_angle=0.02))

            # Update freq and prefix list
            freq[prefix_sum_now] = 1 + freq.get(prefix_sum_now, 0)
            right.set_pairs(freq)
            prefix_values.append(prefix_sum_now)
            self.wait(0.2)

        # Done
        final = Text(f"Total subarrays with sum {self.K}: {res}", font_size=34, color=THEME_GOOD)
        final.next_to(arr, DOWN, buff=0.8)
        self.play(Write(final))
        self.wait(1.8)

# -------------------------------------------------------------
# OPTIONAL Utility Scene: Side-by-side correctness sanity check
# -------------------------------------------------------------
class SubarraySumKQuickCheck(Scene):
    """Tiny scene that demonstrates the function output without visuals."""

    NUMS: List[int] = [1, 2, 3, -1, 1, 2]
    K: int = 3

    def construct(self):
        self.camera.background_color = THEME_BG

        title = Text("Quick Check", font_size=42, color=THEME_TEXT)
        title.to_edge(UP)
        self.play(Write(title))

        nums_text = Text(f"nums = {self.NUMS}", font_size=30, color=THEME_TEXT)
        k_text = Text(f"k = {self.K}", font_size=30, color=THEME_TEXT)
        VGroup(nums_text, k_text).arrange(DOWN, buff=0.25)
        VGroup(nums_text, k_text).move_to(ORIGIN).shift(UP * 0.7)
        self.play(Write(nums_text), Write(k_text))

        sol = Solution()
        ans = sol.subarraySum(self.NUMS, self.K)
        ans_text = Text(f"Solution().subarraySum(nums, k) = {ans}", font_size=34, color=THEME_GOOD)
        ans_text.next_to(k_text, DOWN, buff=0.8)
        self.play(Write(ans_text))
        self.wait(1.5)

# -------------------------------------------------------------
# NOTES
# -----
# 1) If some texts get clipped near edges at 16:9, nudge inward:
#       .to_edge(LEFT).shift(RIGHT * 0.5)
#       .to_edge(RIGHT).shift(LEFT * 0.5)
#
# 2) For heavier arrays, prefer -qm or -ql for faster iteration while tuning.
#
# 3) You can swap to a different palette by adjusting THEME_* colors at top.
#
# 4) If you want to display the dictionary as a real Table, Manim's Table
#    could be used; the custom DictPanel here gives more control over layout.
#
# 5) To animate camera pans/zooms on specific parts, use self.camera.frame.animate.
#
# Happy animating! 🎬
