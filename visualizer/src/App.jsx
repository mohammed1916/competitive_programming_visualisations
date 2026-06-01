import React, {
  useEffect,
  useMemo,
  useState,
  Component,
  lazy,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
const CourseSchedule = lazy(() => import("./problems/CourseSchedule"));
const CourseScheduleII = lazy(() => import("./problems/CourseScheduleII"));
const LongestPalindrome = lazy(() => import("./problems/LongestPalindrome"));
const LRUCache = lazy(() => import("./problems/LRUCache"));
const StringToIntegerAtoi = lazy(() => import("./problems/StringToIntegerAtoi"));
const ZigzagConversion = lazy(() => import("./problems/ZigzagConversion"));
const TwoSum = lazy(() => import("./problems/TwoSum"));
const ValidParentheses = lazy(() => import("./problems/ValidParentheses"));
const MergeTwoSortedLists = lazy(() => import("./problems/MergeTwoSortedLists"));
const MaximumSubarray = lazy(() => import("./problems/MaximumSubarray"));
const ClimbingStairs = lazy(() => import("./problems/ClimbingStairs"));
const BinarySearch = lazy(() => import("./problems/BinarySearch"));
const NumberOfIslands = lazy(() => import("./problems/NumberOfIslands"));
const MergeIntervals = lazy(() => import("./problems/MergeIntervals"));
const TrappingRainWater = lazy(() => import("./problems/TrappingRainWater"));
const LongestSubstringWithoutRepeating = lazy(() => import("./problems/LongestSubstringWithoutRepeating"));
const SpiralMatrix = lazy(() => import("./problems/SpiralMatrix"));
const CombinationSum = lazy(() => import("./problems/CombinationSum"));
const MatrixIterationBasics = lazy(() => import("./problems/MatrixIterationBasics"));
const ContainerWithMostWater = lazy(() => import("./problems/ContainerWithMostWater"));
const RottingOranges = lazy(() => import("./problems/RottingOranges"));
const HouseRobber = lazy(() => import("./problems/HouseRobber"));
const MinimumWindowSubstring = lazy(() => import("./problems/MinimumWindowSubstring"));
const WordSearch = lazy(() => import("./problems/WordSearch"));
const DailyTemperatures = lazy(() => import("./problems/DailyTemperatures"));
const KthLargestElement = lazy(() => import("./problems/KthLargestElement"));
const RedundantConnection = lazy(() => import("./problems/RedundantConnection"));
const ImplementTrie = lazy(() => import("./problems/ImplementTrie"));
const MergeKSortedLists = lazy(() => import("./problems/MergeKSortedLists"));
const LargestRectangleInHistogram = lazy(() => import("./problems/LargestRectangleInHistogram"));
const AddTwoNumbers = lazy(() => import("./problems/AddTwoNumbers"));
const PalindromeNumber = lazy(() => import("./problems/PalindromeNumber"));
const MedianOfTwoSortedArrays = lazy(() => import("./problems/MedianOfTwoSortedArrays"));
const ReverseInteger = lazy(() => import("./problems/ReverseInteger"));
const ThreeSum = lazy(() => import("./problems/ThreeSum"));
const GameOnGrowingTree = lazy(() => import("./problems/GameOnGrowingTree"));
const CourseSchedule = lazy(() => import("./problems/CourseSchedule"));
const CourseScheduleII = lazy(() => import("./problems/CourseScheduleII"));
const LongestPalindrome = lazy(() => import("./problems/LongestPalindrome"));
const LRUCache = lazy(() => import("./problems/LRUCache"));
const StringToIntegerAtoi = lazy(
  () => import("./problems/StringToIntegerAtoi"),
);
const ZigzagConversion = lazy(() => import("./problems/ZigzagConversion"));
const TwoSum = lazy(() => import("./problems/TwoSum"));
const ValidParentheses = lazy(() => import("./problems/ValidParentheses"));
const MergeTwoSortedLists = lazy(
  () => import("./problems/MergeTwoSortedLists"),
);
const MaximumSubarray = lazy(() => import("./problems/MaximumSubarray"));
const ClimbingStairs = lazy(() => import("./problems/ClimbingStairs"));
const BinarySearch = lazy(() => import("./problems/BinarySearch"));
const NumberOfIslands = lazy(() => import("./problems/NumberOfIslands"));
const MergeIntervals = lazy(() => import("./problems/MergeIntervals"));
const TrappingRainWater = lazy(() => import("./problems/TrappingRainWater"));
const LongestSubstringWithoutRepeating = lazy(
  () => import("./problems/LongestSubstringWithoutRepeating"),
);
const SpiralMatrix = lazy(() => import("./problems/SpiralMatrix"));
const CombinationSum = lazy(() => import("./problems/CombinationSum"));
const MatrixIterationBasics = lazy(
  () => import("./problems/MatrixIterationBasics"),
);
const ContainerWithMostWater = lazy(
  () => import("./problems/ContainerWithMostWater"),
);
const RottingOranges = lazy(() => import("./problems/RottingOranges"));
const HouseRobber = lazy(() => import("./problems/HouseRobber"));
const MinimumWindowSubstring = lazy(
  () => import("./problems/MinimumWindowSubstring"),
);
const WordSearch = lazy(() => import("./problems/WordSearch"));
const DailyTemperatures = lazy(() => import("./problems/DailyTemperatures"));
const KthLargestElement = lazy(() => import("./problems/KthLargestElement"));
const RedundantConnection = lazy(
  () => import("./problems/RedundantConnection"),
);
const ImplementTrie = lazy(() => import("./problems/ImplementTrie"));
const MergeKSortedLists = lazy(() => import("./problems/MergeKSortedLists"));
const LargestRectangleInHistogram = lazy(
  () => import("./problems/LargestRectangleInHistogram"),
);
const AddTwoNumbers = lazy(() => import("./problems/AddTwoNumbers"));
const PalindromeNumber = lazy(() => import("./problems/PalindromeNumber"));
const MedianOfTwoSortedArrays = lazy(
  () => import("./problems/MedianOfTwoSortedArrays"),
);
const ReverseInteger = lazy(() => import("./problems/ReverseInteger"));
const ThreeSum = lazy(() => import("./problems/ThreeSum"));
const GameOnGrowingTree = lazy(() => import("./problems/GameOnGrowingTree"));
>>>>>>> Stashed changes
import ProblemScaffold from "./components/panels/ProblemScaffold";
import "./App.css";

const TRACKS = {
  LEETCODE: "leetcode",
  BASICS: "basics",
  CODEFORCES: "codeforces",
};

const IMPLEMENTED_PROBLEMS = [
  {
    id: "lc-1",
    number: "1",
    title: "Two Sum",
    slug: "two-sum",
    description:
      "Find two indices that add to the target using a single-pass hash map to achieve O(n) time.",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    accent: "#22c55e",
    component: TwoSum,
  },
  {
    id: "lc-2",
    number: "2",
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    description:
      "Add two numbers represented by linked lists node by node, carrying over tens.",
    difficulty: "Medium",
    tags: ["Linked List", "Math"],
    accent: "#a855f7",
    component: AddTwoNumbers,
  },
  {
    id: "lc-7",
    number: "7",
    title: "Reverse Integer",
    slug: "reverse-integer",
    description:
      "Pop and push digits while carefully avoiding 32-bit integer overflows.",
    difficulty: "Medium",
    tags: ["Math"],
    accent: "#ef4444",
    component: ReverseInteger,
  },
  {
    id: "lc-9",
    number: "9",
    title: "Palindrome Number",
    slug: "palindrome-number",
    description:
      "Determine if a number is a palindrome by reversing its right half.",
    difficulty: "Easy",
    tags: ["Math"],
    accent: "#a855f7",
    component: PalindromeNumber,
  },
  {
    id: "lc-15",
    number: "15",
    title: "3Sum",
    slug: "3sum",
    description:
      "Sort the array and use two pointers to find triplets that sum to zero.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Sorting"],
    accent: "#0ea5e9",
    component: ThreeSum,
  },
  {
    id: "lc-11",
    number: "11",
    title: "Container With Most Water",
    slug: "container-with-most-water",
    description:
      "Use two pointers shrinking from the outside in to find the maximum area between two lines.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Greedy"],
    accent: "#3b82f6",
    component: ContainerWithMostWater,
  },
  {
    id: "lc-42",
    number: "42",
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    description:
      "Use two pointers with left and right maximums to compute trapped water dynamically without extra space.",
    difficulty: "Hard",
    tags: ["Array", "Two Pointers", "Dynamic Programming"],
    accent: "#3b82f6",
    component: TrappingRainWater,
  },
  {
    id: "lc-54",
    number: "54",
    title: "Spiral Matrix",
    slug: "spiral-matrix",
    description:
      "Traverse a 2D matrix in spiral order by carefully shrinking four directional boundaries (top, bottom, left, right).",
    difficulty: "Medium",
    tags: ["Array", "Matrix", "Simulation"],
    accent: "#f97316",
    component: SpiralMatrix,
  },
  {
    id: "lc-39",
    number: "39",
    title: "Combination Sum",
    slug: "combination-sum",
    description:
      "Use a backtracking depth-first search (DFS) algorithm to find all unique combinations of candidates that sum to the target.",
    difficulty: "Medium",
    tags: ["Array", "Backtracking"],
    accent: "#14b8a6",
    component: CombinationSum,
  },
  {
    id: "lc-20",
    number: "20",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    description:
      "Use a stack to match opening brackets — every closing bracket must pop a matching open bracket.",
    difficulty: "Easy",
    tags: ["String", "Stack"],
    accent: "#f97316",
    component: ValidParentheses,
  },
  {
    id: "lc-21",
    number: "21",
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    description:
      "Use a dummy head and a curr pointer to weave two sorted linked lists in O(n+m) time.",
    difficulty: "Easy",
    tags: ["Linked List", "Two Pointers"],
    accent: "#0ea5e9",
    component: MergeTwoSortedLists,
  },
  {
    id: "lc-3",
    number: "3",
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    description:
      "Use a sliding window and a hash map to track characters and dynamically adjust the window size to find the longest substring without duplicates.",
    difficulty: "Medium",
    tags: ["String", "Sliding Window", "Hash Table"],
    accent: "#8b5cf6",
    component: LongestSubstringWithoutRepeating,
  },
  {
    id: "lc-56",
    number: "56",
    title: "Merge Intervals",
    slug: "merge-intervals",
    description:
      "Sort intervals by start time, then iteratively merge overlapping bounds.",
    difficulty: "Medium",
    tags: ["Array", "Sorting"],
    accent: "#10b981",
    component: MergeIntervals,
  },
  {
    id: "lc-53",
    number: "53",
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    description:
      "Kadane's algorithm: extend the current window or reset it, tracking the global max.",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    accent: "#eab308",
    component: MaximumSubarray,
  },
  {
    id: "lc-70",
    number: "70",
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    description:
      "Classic 1-D DP: dp[i] = dp[i-1] + dp[i-2]. Watch the Fibonacci-like table fill up.",
    difficulty: "Easy",
    tags: ["Dynamic Programming", "Math", "Memoization"],
    accent: "#a855f7",
    component: ClimbingStairs,
  },
  {
    id: "lc-121",
    number: "121",
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    description:
      "Single pass: track the running minimum price and compute the best profit at each step.",
    difficulty: "Easy",
    tags: ["Array", "Dynamic Programming"],
    accent: "#22c55e",
    component: BestTimeBuySellStock,
  },
  {
    id: "lc-125",
    number: "125",
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    description:
      "Filter to alphanumeric lowercase characters, then compare from both ends with two pointers.",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"],
    accent: "#10b981",
    component: ValidPalindrome,
  },
  {
    id: "lc-136",
    number: "136",
    title: "Single Number",
    slug: "single-number",
    description:
      "Use XOR properties to cancel paired numbers and isolate the unique value.",
    difficulty: "Easy",
    tags: ["Array", "Bit Manipulation"],
    accent: "#cba6f7",
    component: SingleNumber,
  },
  {
    id: "lc-169",
    number: "169",
    title: "Majority Element",
    slug: "majority-element",
    description:
      "Boyer-Moore voting tracks a candidate and count to find the majority in linear time and O(1) space.",
    difficulty: "Easy",
    tags: ["Array", "Hash Table", "Divide and Conquer", "Sorting", "Counting"],
    accent: "#a855f7",
    component: MajorityElement,
  },
  {
    id: "lc-202",
    number: "202",
    title: "Happy Number",
    slug: "happy-number",
    description:
      "Iteratively sum squared digits and detect loops with a seen set until reaching 1 or a cycle.",
    difficulty: "Easy",
    tags: ["Hash Table", "Math", "Two Pointers"],
    accent: "#f9e2af",
    component: HappyNumber,
  },
  {
    id: "lc-217",
    number: "217",
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    description:
      "Scan once with a hash set and return true as soon as a repeated value appears.",
    difficulty: "Easy",
    tags: ["Array", "Hash Table", "Sorting"],
    accent: "#f38ba8",
    component: ContainsDuplicate,
  },
  {
    id: "lc-26",
    number: "26",
    title: "Remove Duplicates from Sorted Array",
    slug: "remove-duplicates-from-sorted-array",
    description:
      "Use read/write pointers to compact unique values in-place and return the new length.",
    difficulty: "Easy",
    tags: ["Array", "Two Pointers"],
    accent: "#89b4fa",
    component: RemoveDuplicates,
  },
  {
    id: "lc-283",
    number: "283",
    title: "Move Zeroes",
    slug: "move-zeroes",
    description:
      "Maintain a write pointer for non-zero values and swap in-place to move zeroes to the end.",
    difficulty: "Easy",
    tags: ["Array", "Two Pointers"],
    accent: "#f9e2af",
    component: MoveZeroes,
  },
  {
    id: "lc-344",
    number: "344",
    title: "Reverse String",
    slug: "reverse-string",
    description:
      "Swap characters from both ends with two pointers until they cross.",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"],
    accent: "#a6e3a1",
    component: ReverseString,
  },
  {
    id: "lc-200",
    number: "200",
    title: "Number of Islands",
    slug: "number-of-islands",
    description:
      "BFS flood-fill on a 2-D grid — each unvisited land cell seeds a new island count.",
    difficulty: "Medium",
    tags: ["Array", "BFS", "DFS", "Graph", "Matrix"],
    accent: "#06b6d4",
    component: NumberOfIslands,
  },
  {
    id: "lc-704",
    number: "704",
    title: "Binary Search",
    slug: "binary-search",
    description:
      "Classic binary search: halve the search window each iteration until target is found or window collapses.",
    difficulty: "Easy",
    tags: ["Array", "Binary Search"],
    accent: "#3b82f6",
    component: BinarySearch,
  },
  {
    id: "lc-207",
    number: "207",
    title: "Course Schedule",
    slug: "course-schedule",
    description:
      "Build indegrees, process the zero-indegree queue, and detect cycles with topological sort.",
    difficulty: "Medium",
    tags: ["Graph", "Topological Sort"],
    accent: "#f97316",
    component: CourseSchedule,
  },
  {
    id: "lc-210",
    number: "210",
    title: "Course Schedule II",
    slug: "course-schedule-ii",
    description:
      "Run Kahn's topological sort to build a valid course ordering, or return [] when a cycle blocks completion.",
    difficulty: "Medium",
    tags: ["Graph", "Topological Sort", "BFS"],
    accent: "#0ea5e9",
    component: CourseScheduleII,
  },
  {
    id: "lc-994",
    number: "994",
    title: "Rotting Oranges",
    slug: "rotting-oranges",
    description:
      "Run multi-source BFS over the grid, propagating rotting level by level until all fresh oranges are processed.",
    difficulty: "Medium",
    tags: ["Array", "BFS", "Matrix", "Graph"],
    accent: "#f97316",
    component: RottingOranges,
  },
  {
    id: "lc-198",
    number: "198",
    title: "House Robber",
    slug: "house-robber",
    description:
      "Use rolling dynamic programming states to choose between robbing the current house or skipping it.",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming"],
    accent: "#a855f7",
    component: HouseRobber,
  },
  {
    id: "lc-76",
    number: "76",
    title: "Minimum Window Substring",
    slug: "minimum-window-substring",
    description:
      "Use a sliding window with character frequency accounting to find the smallest valid substring containing all target characters.",
    difficulty: "Hard",
    tags: ["String", "Sliding Window", "Hash Table"],
    accent: "#22c55e",
    component: MinimumWindowSubstring,
  },
  {
    id: "lc-79",
    number: "79",
    title: "Word Search",
    slug: "word-search",
    description:
      "Use DFS + backtracking to trace a path in the grid that matches the target word character by character.",
    difficulty: "Medium",
    tags: ["Array", "Backtracking", "Matrix", "DFS", "String"],
    accent: "#14b8a6",
    component: WordSearch,
  },
  {
    id: "lc-739",
    number: "739",
    title: "Daily Temperatures",
    slug: "daily-temperatures",
    description:
      "Use a decreasing monotonic stack of indices to resolve the next warmer day in linear time.",
    difficulty: "Medium",
    tags: ["Array", "Stack", "Monotonic Stack"],
    accent: "#f97316",
    component: DailyTemperatures,
  },
  {
    id: "lc-215",
    number: "215",
    title: "Kth Largest Element in an Array",
    slug: "kth-largest-element-in-an-array",
    description:
      "Maintain a size-k min-heap while scanning numbers; heap root is the kth largest.",
    difficulty: "Medium",
    tags: ["Array", "Heap", "Priority Queue", "Divide and Conquer"],
    accent: "#0ea5e9",
    component: KthLargestElement,
  },
  {
    id: "lc-684",
    number: "684",
    title: "Redundant Connection",
    slug: "redundant-connection",
    description:
      "Use Union-Find to detect the first edge that forms a cycle in an undirected graph.",
    difficulty: "Medium",
    tags: ["Graph", "Union Find", "Tree"],
    accent: "#ef4444",
    component: RedundantConnection,
  },
  {
    id: "lc-208",
    number: "208",
    title: "Implement Trie (Prefix Tree)",
    slug: "implement-trie-prefix-tree",
    description:
      "Build and query a prefix tree with insert, search, and startsWith operations.",
    difficulty: "Medium",
    tags: ["String", "Design", "Trie", "Hash Table"],
    accent: "#22c55e",
    component: ImplementTrie,
  },
  {
    id: "lc-23",
    number: "23",
    title: "Merge k Sorted Lists",
    slug: "merge-k-sorted-lists",
    description:
      "Use a min-heap over current list heads to repeatedly pick the global minimum in O(N log k).",
    difficulty: "Hard",
    tags: ["Linked List", "Heap", "Divide and Conquer"],
    accent: "#a855f7",
    component: MergeKSortedLists,
  },
  {
    id: "lc-84",
    number: "84",
    title: "Largest Rectangle in Histogram",
    slug: "largest-rectangle-in-histogram",
    description:
      "Use a monotonic increasing stack to compute maximal rectangle areas when bars are popped.",
    difficulty: "Hard",
    tags: ["Array", "Stack", "Monotonic Stack"],
    accent: "#f97316",
    component: LargestRectangleInHistogram,
  },
  {
    id: "lc-5",
    number: "5",
    title: "Longest Palindromic Substring",
    slug: "longest-palindromic-substring",
    description:
      "Find the longest palindromic substring. Bottom-up DP with O(n²) time & space.",
    difficulty: "Medium",
    tags: ["Dynamic Programming", "String"],
    accent: "#8b5cf6",
    component: LongestPalindrome,
  },
  {
    id: "lc-9",
    number: "9",
    title: "Palindrome Number",
    slug: "palindrome-number",
    description:
      "Check whether integer reads the same backward as forward. Visualize digit extraction and reversal.",
    difficulty: "Easy",
    tags: ["Math", "String"],
    accent: "#10b981",
    component: PalindromeNumber,
  },
  {
    id: "lc-4",
    number: "4",
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    description:
      "Find median of two sorted arrays. Visualization placeholder available.",
    difficulty: "Hard",
    tags: ["Array", "Binary Search"],
    accent: "#64748b",
    component: MedianOfTwoSortedArrays,
  },
  {
    id: "lc-146",
    number: "146",
    title: "LRU Cache",
    slug: "lru-cache",
    description:
      "Track O(1) get/put with a hash map and doubly linked list while MRU/LRU order updates live.",
    difficulty: "Medium",
    tags: ["Design", "Hash Map", "Linked List"],
    accent: "#0ea5e9",
    component: LRUCache,
  },
  {
    id: "lc-6",
    number: "6",
    title: "Zigzag Conversion",
    slug: "zigzag-conversion",
    description:
      "Trace how characters bounce between rows and then merge row buckets into the final answer.",
    difficulty: "Medium",
    tags: ["String", "Simulation"],
    accent: "#22c55e",
    component: ZigzagConversion,
  },
  {
    id: "lc-8",
    number: "8",
    title: "String to Integer (atoi)",
    slug: "string-to-integer-atoi",
    description:
      "Follow the parser through whitespace, sign, digits, stop conditions, and 32-bit clamping.",
    difficulty: "Medium",
    tags: ["String", "Simulation"],
    accent: "#3b82f6",
    component: StringToIntegerAtoi,
  },
];

const problemModules = import.meta.glob("./problems/**/index.jsx");

const slugFromPath = (path) => {
  const parts = path.split("/");
  const folder = parts[parts.length - 2];
  return folder.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
};

const EXTRA_PROBLEMS = Object.keys(problemModules)
  .map((path) => {
    const slug = slugFromPath(path);
    if (IMPLEMENTED_PROBLEMS.some((p) => p.slug === slug)) return null;
    return {
      id: `auto-${slug}`,
      number: "",
      title: slug.replace(/-/g, " "),
      slug,
      description:
        "Cataloged in explorer. Visualizer shell is ready; implementation can be plugged into reusable panels.",
      difficulty: "Medium",
      tags: [],
      accent: "#64748b",
      component: lazy(() => problemModules[path]()),
      implemented: true,
    };
  })
  .filter(Boolean);

const ALL_IMPLEMENTED = IMPLEMENTED_PROBLEMS.concat(EXTRA_PROBLEMS);

const IMPLEMENTED_BY_NUMBER = new Map(
  ALL_IMPLEMENTED.map((problem) => [problem.number, problem]),
);

const BASICS_PROBLEMS = [
  {
    id: "bs-01",
    number: "B1",
    title: "Matrix Iteration Patterns",
    slug: "matrix-iteration-patterns",
    description:
      "Explore upper/lower triangular, diagonal, anti-diagonal and full matrix traversals.",
    difficulty: "Easy",
    tags: ["Matrix", "Loops", "Basics"],
    accent: "#0ea5e9",
    component: MatrixIterationBasics,
    implemented: true,
  },
];

const CODEFORCES_PROBLEMS = [
  {
    id: "cf-2000-f-game-on-growing-tree",
    number: "F",
    title: "Game on Growing Tree",
    slug: "game-on-growing-tree",
    description:
      "After each insertion in a growing tree, compute Alice's optimal final score against Bob using a compressed DP strategy.",
    difficulty: "Hard",
    tags: ["Tree", "Game Theory", "DP", "Codeforces"],
    accent: "#f97316",
    component: GameOnGrowingTree,
    implemented: true,
  },
];

function buildCatalogProblems(catalogProblems) {
  return catalogProblems.map((problem) => {
    const implemented = IMPLEMENTED_BY_NUMBER.get(problem.number);
    if (!implemented) {
      return {
        ...problem,
        accent: "#64748b",
        description:
          "Cataloged in explorer. Visualizer shell is ready; implementation can be plugged into reusable panels.",
        component: null,
        implemented: false,
      };
    }

    return {
      ...problem,
      ...implemented,
      implemented: true,
    };
  });
}

/* ── Error Boundary ──────────────────────────────────────────────────── */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Visualizer error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 16,
            padding: 32,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32 }}>⚠️</div>
          <h2 style={{ color: "#f87171", margin: 0 }}>Visualizer Error</h2>
          <p style={{ margin: 0, maxWidth: 480, fontSize: 14 }}>
            {this.state.error.message ||
              "An unexpected error occurred in this visualizer."}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#f8fafc",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function LayoutControls({ layoutWidth, onChange, compact = false }) {
  return (
    <div className={`layout-controls ${compact ? "compact" : ""}`}>
      <span className="layout-label">Layout</span>
      <div className="layout-pill">
        <button
          className={`layout-btn ${layoutWidth === "normal" ? "active" : ""}`}
          onClick={() => onChange("normal")}
        >
          Normal
        </button>
        <button
          className={`layout-btn ${layoutWidth === "wide" ? "active" : ""}`}
          onClick={() => onChange("wide")}
        >
          Wide
        </button>
        <button
          className={`layout-btn ${layoutWidth === "full" ? "active" : ""}`}
          onClick={() => onChange("full")}
        >
          Full
        </button>
      </div>
    </div>
  );
}

function SettingsMenu({
  navigationTransitionsEnabled,
  onToggleNavigationTransitions,
}) {
  return (
    <details className="settings-menu">
      <summary className="settings-summary" aria-label="Open settings">
        <span className="settings-summary-icon">⚙</span>
        <span>Settings</span>
      </summary>
      <div className="settings-panel">
        <div className="settings-panel-title">Navigation</div>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={navigationTransitionsEnabled}
            onChange={(event) =>
              onToggleNavigationTransitions(event.target.checked)
            }
          />
          <span>
            <strong>Enable transitions</strong>
            <small>Animate page switches and problem card entrances.</small>
          </span>
        </label>
      </div>
    </details>
  );
}

function ProblemPage({
  problem,
  onBack,
  layoutWidth,
  onLayoutChange,
  enableTransitions,
}) {
  const Component = problem.component;
  const Shell = enableTransitions ? motion.div : "div";
  const shellProps = enableTransitions
    ? {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
        transition: { type: "spring", stiffness: 320, damping: 35 },
      }
    : {};
  return (
    <Shell className="problem-page" {...shellProps}>
      <header className="problem-header">
        <button className="back-btn" onClick={onBack}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Problems
        </button>
        <div className="problem-title-group">
          <span className="problem-num">#{problem.number}</span>
          <h1 className="problem-title">{problem.title}</h1>
        </div>
        <span
          className={`difficulty badge difficulty-${problem.difficulty.toLowerCase()}`}
        >
          {problem.difficulty}
        </span>
        <LayoutControls
          layoutWidth={layoutWidth}
          onChange={onLayoutChange}
          compact
        />
      </header>
      <div className="problem-content">
        <ErrorBoundary key={problem.id}>
          {Component ? (
            <Suspense
              fallback={
                <div style={{ padding: 20, color: "#94a3b8" }}>
                  Loading visualizer…
                </div>
              }
            >
              <Component problem={problem} />
            </Suspense>
          ) : (
            <ProblemScaffold problem={problem} />
          )}
        </ErrorBoundary>
      </div>
    </Shell>
  );
}

function HomePage({
  track,
  onTrackChange,
  onSelect,
  layoutWidth,
  onLayoutChange,
  enableTransitions,
}) {
  const [catalogProblems, setCatalogProblems] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("All");
  const [activeTag, setActiveTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(60);

  const isLeetCodeTrack = track === TRACKS.LEETCODE;
  const isCodeforcesTrack = track === TRACKS.CODEFORCES;

  useEffect(() => {
    if (!isLeetCodeTrack) return;

    let cancelled = false;

    fetch("/data/leetcodeCatalog.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Catalog load failed: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const nextCatalogProblems = Array.isArray(payload?.problems)
          ? payload.problems
          : [];
        setCatalogProblems(nextCatalogProblems);
        setCatalogError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalogError(error.message || "Failed to load LeetCode catalog");
      });

    return () => {
      cancelled = true;
    };
  }, [isLeetCodeTrack]);

  const allProblems = useMemo(() => {
    if (isLeetCodeTrack) return buildCatalogProblems(catalogProblems);
    if (isCodeforcesTrack) return CODEFORCES_PROBLEMS;
    return BASICS_PROBLEMS;
  }, [catalogProblems, isCodeforcesTrack, isLeetCodeTrack]);

  const allTags = useMemo(() => {
    return Array.from(
      new Set(allProblems.flatMap((problem) => problem.tags || [])),
    ).sort();
  }, [allProblems]);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = allProblems.filter((problem) => {
    if (difficulty !== "All" && problem.difficulty !== difficulty) return false;
    if (status === "Implemented" && !problem.implemented) return false;
    if (status === "Catalog Only" && problem.implemented) return false;
    if (activeTag !== "All" && !(problem.tags || []).includes(activeTag))
      return false;
    if (!normalizedSearch) return true;

    const haystack =
      `${problem.number} ${problem.title} ${problem.slug} ${(problem.tags || []).join(" ")}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const visible = filtered.slice(0, visibleCount);
  const Shell = enableTransitions ? motion.div : "div";
  const shellProps = enableTransitions
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {};
  const Brand = enableTransitions ? motion.div : "div";

  return (
    <Shell className="home-page" {...shellProps}>
      <header className="home-header">
        <div className="home-header-row">
          <Brand
            className="brand"
            {...(enableTransitions
              ? {
                  initial: { y: -18, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  transition: { delay: 0.08, type: "spring", stiffness: 280 },
                }
              : {})}
          >
            <div className="brand-icon">⟨/⟩</div>
            <div>
              <h1>CP Visualizer</h1>
              <p>
                {isLeetCodeTrack
                  ? "LeetCode and interview patterns"
                  : isCodeforcesTrack
                    ? "Codeforces competitive programming problems"
                    : "Core programming basics and loop patterns"}
              </p>
            </div>
          </Brand>

          <div
            className="track-switcher"
            role="tablist"
            aria-label="Problem tracks"
          >
            <button
              className={`track-btn ${track === TRACKS.LEETCODE ? "active" : ""}`}
              onClick={() => onTrackChange(TRACKS.LEETCODE)}
            >
              LeetCode Track
            </button>
            <button
              className={`track-btn ${track === TRACKS.BASICS ? "active" : ""}`}
              onClick={() => onTrackChange(TRACKS.BASICS)}
            >
              Basics Track
            </button>
            <button
              className={`track-btn ${track === TRACKS.CODEFORCES ? "active" : ""}`}
              onClick={() => onTrackChange(TRACKS.CODEFORCES)}
            >
              Codeforces Track
            </button>
          </div>

          <LayoutControls layoutWidth={layoutWidth} onChange={onLayoutChange} />
        </div>

        <div className="catalog-meta">
          <span>
            {isLeetCodeTrack
              ? `Total catalog: ${allProblems.length}`
              : isCodeforcesTrack
                ? `Codeforces problems: ${allProblems.length}`
                : `Basics topics: ${allProblems.length}`}
          </span>
          <span>
            Implemented:{" "}
            {allProblems.filter((problem) => problem.implemented).length}
          </span>
          <span>Visible: {filtered.length}</span>
          {isLeetCodeTrack && catalogError ? (
            <span>Catalog error: {catalogError}</span>
          ) : null}
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(60);
            }}
            placeholder="Search by number, title, slug, or tag"
          />

          <select
            className="filter-select"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          {isLeetCodeTrack ? (
            <select
              className="filter-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All</option>
              <option>Implemented</option>
              <option>Catalog Only</option>
            </select>
          ) : (
            <div className="track-note">
              {isCodeforcesTrack
                ? "Codeforces track focuses on advanced contest strategies and data structures."
                : "Basics track includes foundational loop visualizations."}
            </div>
          )}
        </div>

        <div className="tag-row">
          <button
            className={`tag-filter ${activeTag === "All" ? "active" : ""}`}
            onClick={() => setActiveTag("All")}
          >
            All
          </button>
          {allTags.slice(0, 24).map((tag) => (
            <button
              key={tag}
              className={`tag-filter ${activeTag === tag ? "active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      <main className="cards-grid">
        {visible.map((p, i) =>
          enableTransitions ? (
            <motion.button
              key={p.id}
              className="problem-card"
              style={{ "--accent": p.accent }}
              onClick={() => onSelect(p)}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.14 + i * 0.07,
                type: "spring",
                stiffness: 260,
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="card-top">
                <span
                  className={`badge difficulty-${p.difficulty.toLowerCase()}`}
                >
                  {p.difficulty}
                </span>
                <span className="card-num">#{p.number}</span>
              </div>
              <h2 className="card-title">{p.title}</h2>
              <p className="card-desc">{p.description}</p>
              <div className="card-footer">
                <div className="card-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="card-arrow">{p.implemented ? "→" : "⋯"}</span>
              </div>
            </motion.button>
          ) : (
            <button
              key={p.id}
              className="problem-card"
              style={{ "--accent": p.accent }}
              onClick={() => onSelect(p)}
            >
              <div className="card-top">
                <span
                  className={`badge difficulty-${p.difficulty.toLowerCase()}`}
                >
                  {p.difficulty}
                </span>
                <span className="card-num">#{p.number}</span>
              </div>
              <h2 className="card-title">{p.title}</h2>
              <p className="card-desc">{p.description}</p>
              <div className="card-footer">
                <div className="card-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="card-arrow">{p.implemented ? "→" : "⋯"}</span>
              </div>
            </button>
          ),
        )}
      </main>

      {visibleCount < filtered.length && (
        <div className="load-more-wrap">
          <button
            className="load-more-btn"
            onClick={() => setVisibleCount((count) => count + 60)}
          >
            Load 60 more problems
          </button>
        </div>
      )}
    </Shell>
  );
}

/* ── Root App ────────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState(null);
  const [track, setTrack] = useState(TRACKS.LEETCODE);
  const [layoutWidth, setLayoutWidth] = useState("full");
  const [navigationTransitionsEnabled, setNavigationTransitionsEnabled] =
    useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("cpviz.navigationTransitions");
      if (stored !== null) {
        setNavigationTransitionsEnabled(stored !== "0");
      }
    } catch (error) {
      void error;
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "cpviz.navigationTransitions",
        navigationTransitionsEnabled ? "1" : "0",
      );
    } catch (error) {
      void error;
    }
  }, [navigationTransitionsEnabled]);

  // Keep browser history in sync so the browser back button works
  useEffect(() => {
    if (active) {
      window.history.pushState({ slug: active.slug }, "", `#${active.slug}`);
    } else {
      window.history.pushState({}, "", window.location.pathname);
    }
  }, [active]);

  useEffect(() => {
    const onPop = () => setActive(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The in-app back button: just set state; the history.pushState in the
  // other effect will update the URL, and popstate won't fire on pushState.
  const goBack = () => setActive(null);

  const handleTrackChange = (nextTrack) => {
    setTrack(nextTrack);
    setActive(null);
  };

  const pageContent = active ? (
    <ProblemPage
      key={active.id}
      problem={active}
      onBack={goBack}
      layoutWidth={layoutWidth}
      onLayoutChange={setLayoutWidth}
      enableTransitions={navigationTransitionsEnabled}
    />
  ) : (
    <HomePage
      key={`home-${track}`}
      track={track}
      onTrackChange={handleTrackChange}
      onSelect={setActive}
      layoutWidth={layoutWidth}
      onLayoutChange={setLayoutWidth}
      enableTransitions={navigationTransitionsEnabled}
    />
  );

  return (
    <div className={`app layout-${layoutWidth}`}>
      <div className="app-toolbar">
        <SettingsMenu
          navigationTransitionsEnabled={navigationTransitionsEnabled}
          onToggleNavigationTransitions={setNavigationTransitionsEnabled}
        />
      </div>
      {navigationTransitionsEnabled ? (
        <AnimatePresence mode="wait">{pageContent}</AnimatePresence>
      ) : (
        pageContent
      )}
    </div>
  );
}
