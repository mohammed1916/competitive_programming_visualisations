import { useEffect, useMemo, useState, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CourseSchedule from "./problems/CourseSchedule";
import CourseScheduleII from "./problems/CourseScheduleII";
import LongestPalindrome from "./problems/LongestPalindrome";
import LRUCache from "./problems/LRUCache";
import StringToIntegerAtoi from "./problems/StringToIntegerAtoi";
import ZigzagConversion from "./problems/ZigzagConversion";
import TwoSum from "./problems/TwoSum";
import ValidParentheses from "./problems/ValidParentheses";
import MergeTwoSortedLists from "./problems/MergeTwoSortedLists";
import MaximumSubarray from "./problems/MaximumSubarray";
import ClimbingStairs from "./problems/ClimbingStairs";
import BinarySearch from "./problems/BinarySearch";
import NumberOfIslands from "./problems/NumberOfIslands";
import MergeIntervals from "./problems/MergeIntervals";
import TrappingRainWater from "./problems/TrappingRainWater";
import LongestSubstringWithoutRepeating from "./problems/LongestSubstringWithoutRepeating";
import SpiralMatrix from "./problems/SpiralMatrix";
import CombinationSum from "./problems/CombinationSum";
import MatrixIterationBasics from "./problems/MatrixIterationBasics";
import ContainerWithMostWater from "./problems/ContainerWithMostWater";
import RottingOranges from "./problems/RottingOranges";
import HouseRobber from "./problems/HouseRobber";
import MinimumWindowSubstring from "./problems/MinimumWindowSubstring";
import WordSearch from "./problems/WordSearch";
import DailyTemperatures from "./problems/DailyTemperatures";
import KthLargestElement from "./problems/KthLargestElement";
import RedundantConnection from "./problems/RedundantConnection";
import ImplementTrie from "./problems/ImplementTrie";
import MergeKSortedLists from "./problems/MergeKSortedLists";
import LargestRectangleInHistogram from "./problems/LargestRectangleInHistogram";
import AddTwoNumbers from "./problems/AddTwoNumbers";
import PalindromeNumber from "./problems/PalindromeNumber";
import MedianOfTwoSortedArrays from "./problems/MedianOfTwoSortedArrays";
import ReverseInteger from "./problems/ReverseInteger";
import ThreeSum from "./problems/ThreeSum";
import ReverseLinkedList from "./problems/ReverseLinkedList";
import ProductOfArrayExceptSelf from "./problems/ProductOfArrayExceptSelf";
import JumpGame from "./problems/JumpGame";
import CoinChange from "./problems/CoinChange";
import BestTimeBuySellStock from "./problems/BestTimeBuySellStock";
import ValidAnagram from "./problems/ValidAnagram";
import LongestIncreasingSubsequence from "./problems/LongestIncreasingSubsequence";
import LinkedListCycle from "./problems/LinkedListCycle";
import MinStack from "./problems/MinStack";
import SearchInRotatedSortedArray from "./problems/SearchInRotatedSortedArray";
import DecodeWays from "./problems/DecodeWays";
import UniquePaths from "./problems/UniquePaths";
import WordBreak from "./problems/WordBreak";
import TwoSumII from "./problems/TwoSumII";
import GroupAnagrams from "./problems/GroupAnagrams";
import LongestConsecutiveSequence from "./problems/LongestConsecutiveSequence";
import FindMinRotatedSortedArray from "./problems/FindMinRotatedSortedArray";
import MajorityElement from "./problems/MajorityElement";
import MaxProductSubarray from "./problems/MaxProductSubarray";
import MaxDepthBinaryTree from "./problems/MaxDepthBinaryTree";
import InvertBinaryTree from "./problems/InvertBinaryTree";
import RemoveNthNode from "./problems/RemoveNthNode";
import BinaryTreeLevelOrder from "./problems/BinaryTreeLevelOrder";
import DiameterBinaryTree from "./problems/DiameterBinaryTree";
import CountingBits from "./problems/CountingBits";
import LCABST from "./problems/LCABST";
import ValidateBST from "./problems/ValidateBST";
import RightSideView from "./problems/RightSideView";
import LCS from "./problems/LCS";
import HouseRobberII from "./problems/HouseRobberII";
import FindDuplicate from "./problems/FindDuplicate";
import BalancedBinaryTree from "./problems/BalancedBinaryTree";
import LCABinaryTree from "./problems/LCABinaryTree";
import KthSmallest from "./problems/KthSmallest";
import NonOverlappingIntervals from "./problems/NonOverlappingIntervals";
import PalindromicSubstrings from "./problems/PalindromicSubstrings";
import Subsets from "./problems/Subsets";
import Permutations from "./problems/Permutations";
import SubtreeOfAnotherTree from "./problems/SubtreeOfAnotherTree";
import ConstructBinaryTree from "./problems/ConstructBinaryTree";
import BinaryTreeMaxPath from "./problems/BinaryTreeMaxPath";
import ValidPalindrome from "./problems/ValidPalindrome";
import EncodeDecodeStrings from "./problems/EncodeDecodeStrings";
import FindMedianDataStream from "./problems/FindMedianDataStream";
import LongestRepeatingCharReplace from "./problems/LongestRepeatingCharReplace";
import SubarraySumEqualsK from "./problems/SubarraySumEqualsK";
import TopKFrequent from "./problems/TopKFrequent";
import GenerateParentheses from "./problems/GenerateParentheses";
import LetterCombinations from "./problems/LetterCombinations";
import SlidingWindowMaximum from "./problems/SlidingWindowMaximum";
import EvalRPN from "./problems/EvalRPN";
import RotateImage from "./problems/RotateImage";
import SetMatrixZeroes from "./problems/SetMatrixZeroes";
import Search2DMatrix from "./problems/Search2DMatrix";
import ReorderList from "./problems/ReorderList";
import PalindromePartitioning from "./problems/PalindromePartitioning";
import InsertInterval from "./problems/InsertInterval";
import SortColors from "./problems/SortColors";
import CopyListRandom from "./problems/CopyListRandom";
import SortList from "./problems/SortList";
import DecodeString from "./problems/DecodeString";
import ProblemScaffold from "./components/panels/ProblemScaffold";
import "./App.css";

const TRACKS = {
  LEETCODE: "leetcode",
  BASICS: "basics",
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
  {
    id: "lc-15",
    number: "15",
    title: "3Sum",
    slug: "3sum",
    description:
      "Sort the array, fix one element with i, then use two converging pointers l and r to find all unique zero-sum triplets in O(n²).",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Sorting"],
    accent: "#0ea5e9",
    component: ThreeSum,
  },
  {
    id: "lc-55",
    number: "55",
    title: "Jump Game",
    slug: "jump-game",
    description:
      "Track the furthest reachable index (maxReach) greedily. If you ever step past it, return false — otherwise return true.",
    difficulty: "Medium",
    tags: ["Array", "Greedy", "Dynamic Programming"],
    accent: "#22c55e",
    component: JumpGame,
  },
  {
    id: "lc-206",
    number: "206",
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    description:
      "Iteratively reverse a singly linked list by flipping each next pointer while tracking prev, curr, and next.",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
    accent: "#a855f7",
    component: ReverseLinkedList,
  },
  {
    id: "lc-238",
    number: "238",
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    description:
      "Two-pass O(n) solution: a left-to-right prefix sweep followed by a right-to-left suffix sweep — no division required.",
    difficulty: "Medium",
    tags: ["Array", "Prefix Sum"],
    accent: "#f97316",
    component: ProductOfArrayExceptSelf,
  },
  {
    id: "lc-322",
    number: "322",
    title: "Coin Change",
    slug: "coin-change",
    description:
      "Bottom-up DP: build dp[0..amount] where dp[a] is the fewest coins needed. For each amount try every coin denomination.",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "BFS"],
    accent: "#eab308",
    component: CoinChange,
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
    id: "lc-141",
    number: "141",
    title: "Linked List Cycle",
    slug: "linked-list-cycle",
    description:
      "Floyd's tortoise and hare: move slow one step and fast two steps — if they meet a cycle exists.",
    difficulty: "Easy",
    tags: ["Linked List", "Two Pointers"],
    accent: "#f97316",
    component: LinkedListCycle,
  },
  {
    id: "lc-155",
    number: "155",
    title: "Min Stack",
    slug: "min-stack",
    description:
      "Design a stack that supports push, pop, top, and getMin in O(1) using a parallel min-tracking stack.",
    difficulty: "Medium",
    tags: ["Stack", "Design"],
    accent: "#0ea5e9",
    component: MinStack,
  },
  {
    id: "lc-242",
    number: "242",
    title: "Valid Anagram",
    slug: "valid-anagram",
    description:
      "Increment character counts for s, decrement for t — any negative count means t has an extra character.",
    difficulty: "Easy",
    tags: ["String", "Hash Table", "Sorting"],
    accent: "#14b8a6",
    component: ValidAnagram,
  },
  {
    id: "lc-300",
    number: "300",
    title: "Longest Increasing Subsequence",
    slug: "longest-increasing-subsequence",
    description:
      "O(n²) DP: dp[i] = length of LIS ending at index i, computed by checking all previous elements.",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "Binary Search"],
    accent: "#a855f7",
    component: LongestIncreasingSubsequence,
  },
  {
    id: "lc-33",
    number: "33",
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    description:
      "Binary search on a rotated sorted array: determine which half is sorted, then decide which side the target falls in.",
    difficulty: "Medium",
    tags: ["Array", "Binary Search"],
    accent: "#f97316",
    component: SearchInRotatedSortedArray,
  },
  {
    id: "lc-91",
    number: "91",
    title: "Decode Ways",
    slug: "decode-ways",
    description:
      "1D DP: dp[i] counts decodings of s[0..i-1]. Each position can decode one or two digits if they map to a valid letter.",
    difficulty: "Medium",
    tags: ["String", "Dynamic Programming"],
    accent: "#eab308",
    component: DecodeWays,
  },
  {
    id: "lc-62",
    number: "62",
    title: "Unique Paths",
    slug: "unique-paths",
    description:
      "2D DP: dp[r][c] = dp[r-1][c] + dp[r][c-1]. Fill the grid from top-left; each cell sums paths from above and left.",
    difficulty: "Medium",
    tags: ["Math", "Dynamic Programming"],
    accent: "#0ea5e9",
    component: UniquePaths,
  },
  {
    id: "lc-139",
    number: "139",
    title: "Word Break",
    slug: "word-break",
    description:
      "DP: dp[i]=True if s[0..i-1] can be segmented. For each i try all splits s[j:i] and check if dp[j] and the word is in the dictionary.",
    difficulty: "Medium",
    tags: ["String", "Dynamic Programming", "Trie"],
    accent: "#14b8a6",
    component: WordBreak,
  },
  {
    number: "167",
    title: "Two Sum II - Input Array Is Sorted",
    description:
      "Two-pointer approach: start lo=0, hi=n-1. If sum matches target return; if sum too small move lo right; if too large move hi left. O(n) time, O(1) space.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Binary Search"],
    accent: "#0ea5e9",
    component: TwoSumII,
  },
  {
    number: "49",
    title: "Group Anagrams",
    description:
      "Sort each word to form a canonical key. Words with the same sorted key are anagrams. Collect groups in a hash map keyed by the sorted characters.",
    difficulty: "Medium",
    tags: ["Array", "Hash Table", "String", "Sorting"],
    accent: "#f97316",
    component: GroupAnagrams,
  },
  {
    number: "128",
    title: "Longest Consecutive Sequence",
    description:
      "Insert all numbers into a hash set. For each number that is the start of a sequence (num-1 not in set), count consecutive elements. Track best length. O(n) time.",
    difficulty: "Medium",
    tags: ["Array", "Hash Table", "Union Find"],
    accent: "#a855f7",
    component: LongestConsecutiveSequence,
  },
  {
    number: "153",
    title: "Find Minimum in Rotated Sorted Array",
    description:
      "Binary search: if nums[mid] > nums[hi] the minimum is in the right half (lo=mid+1), otherwise it's in the left half including mid (hi=mid). Loop ends when lo==hi.",
    difficulty: "Medium",
    tags: ["Array", "Binary Search"],
    accent: "#14b8a6",
    component: FindMinRotatedSortedArray,
  },
  {
    number: "169",
    title: "Majority Element",
    description:
      "Boyer-Moore voting: maintain a candidate and a count. When count reaches 0, switch candidate to the current element. Matching elements increment count; others decrement it. O(n) time, O(1) space.",
    difficulty: "Easy",
    tags: ["Array", "Hash Table", "Divide and Conquer", "Sorting"],
    accent: "#cba6f7",
    component: MajorityElement,
  },
  {
    number: "152",
    title: "Maximum Product Subarray",
    description:
      "Track curMax and curMin ending at each position (negatives can flip sign). At each element consider num alone, curMax×num, curMin×num as candidates. Update global result with curMax. O(n) time.",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming"],
    accent: "#a6e3a1",
    component: MaxProductSubarray,
  },
  {
    number: "104",
    title: "Maximum Depth of Binary Tree",
    description:
      "Post-order DFS: recursively compute depth of left and right subtrees, return 1 + max(left, right). Base case: null node returns 0. O(n) time.",
    difficulty: "Easy",
    tags: ["Tree", "DFS", "BFS", "Binary Tree"],
    accent: "#f9e2af",
    component: MaxDepthBinaryTree,
  },
  {
    number: "226",
    title: "Invert Binary Tree",
    description:
      "Post-order DFS: recursively invert left and right subtrees, then swap the two children pointers. Every node's children are swapped exactly once on the way back up. O(n) time.",
    difficulty: "Easy",
    tags: ["Tree", "DFS", "BFS", "Binary Tree"],
    accent: "#89dceb",
    component: InvertBinaryTree,
  },
  {
    number: "19",
    title: "Remove Nth Node From End of List",
    description:
      "Use a dummy head and two pointers. Advance fast by n+1 steps, then co-move fast and slow until fast is null. slow.next is the node to delete. O(n) one-pass.",
    difficulty: "Medium",
    tags: ["Linked List", "Two Pointers"],
    accent: "#89b4fa",
    component: RemoveNthNode,
  },
  {
    number: "102",
    title: "Binary Tree Level Order Traversal",
    description:
      "BFS with a queue. At each iteration snapshot queue length, process exactly that many nodes, appending their values to the current level. Push children for the next level. O(n) time.",
    difficulty: "Medium",
    tags: ["Tree", "BFS", "Binary Tree"],
    accent: "#89b4fa",
    component: BinaryTreeLevelOrder,
  },
  {
    number: "543",
    title: "Diameter of Binary Tree",
    description:
      "Post-order DFS: at each node compute left depth and right depth. Update global diameter with left+right. Return 1+max(left,right) to parent. O(n) time.",
    difficulty: "Easy",
    tags: ["Tree", "DFS", "Binary Tree"],
    accent: "#cba6f7",
    component: DiameterBinaryTree,
  },
  {
    number: "338",
    title: "Counting Bits",
    description:
      "DP: dp[i] = dp[i>>1] + (i&1). Shifting right divides by 2 (same bit count minus the LSB), and (i&1) adds back the least-significant bit. Fills the array in O(n) time.",
    difficulty: "Easy",
    tags: ["Dynamic Programming", "Bit Manipulation"],
    accent: "#f9e2af",
    component: CountingBits,
  },
  {
    number: "235",
    title: "Lowest Common Ancestor of a BST",
    description:
      "Walk from root: if both p and q are less than current node go left; if both greater go right; otherwise the current node is the split point and the LCA. O(h) time.",
    difficulty: "Medium",
    tags: ["Tree", "DFS", "BST", "Binary Search Tree"],
    accent: "#cba6f7",
    component: LCABST,
  },
  {
    number: "98",
    title: "Validate Binary Search Tree",
    slug: "validate-binary-search-tree",
    description:
      "DFS with (lo, hi) bounds — each node must lie strictly within the range inherited from its ancestors. O(n) time, O(h) space.",
    difficulty: "Medium",
    tags: ["Tree", "DFS", "BST"],
    accent: "#a6e3a1",
    component: ValidateBST,
  },
  {
    number: "199",
    title: "Binary Tree Right Side View",
    slug: "binary-tree-right-side-view",
    description:
      "BFS level-by-level; at the end of each level record the last node's value. O(n) time and space.",
    difficulty: "Medium",
    tags: ["Tree", "BFS"],
    accent: "#cba6f7",
    component: RightSideView,
  },
  {
    number: "1143",
    title: "Longest Common Subsequence",
    slug: "longest-common-subsequence",
    description:
      "Classic 2-D DP: if characters match, dp[i][j] = dp[i-1][j-1]+1, else max(dp[i-1][j], dp[i][j-1]). O(m·n) time and space.",
    difficulty: "Medium",
    tags: ["DP", "String"],
    accent: "#89b4fa",
    component: LCS,
  },
  {
    number: "213",
    title: "House Robber II",
    slug: "house-robber-ii",
    description:
      "Circular arrangement — run House Robber twice (skip last house, then skip first house) and return the maximum. O(n) time, O(1) space.",
    difficulty: "Medium",
    tags: ["DP", "Array"],
    accent: "#fab387",
    component: HouseRobberII,
  },
  {
    number: "287",
    title: "Find the Duplicate Number",
    slug: "find-the-duplicate-number",
    description:
      "Floyd's cycle detection on the implicit linked list nums[i]→nums[nums[i]]: phase 1 finds the cycle meeting point, phase 2 finds the entrance (the duplicate). O(n) time, O(1) space.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Floyd's Cycle"],
    accent: "#f38ba8",
    component: FindDuplicate,
  },
  {
    number: "110",
    title: "Balanced Binary Tree",
    slug: "balanced-binary-tree",
    description:
      "Post-order DFS that returns height or -1 if the subtree is unbalanced. Detects imbalance in a single pass. O(n) time, O(h) space.",
    difficulty: "Easy",
    tags: ["Tree", "DFS"],
    accent: "#a6e3a1",
    component: BalancedBinaryTree,
  },
  {
    number: "236",
    title: "Lowest Common Ancestor of a Binary Tree",
    slug: "lowest-common-ancestor-binary-tree",
    description:
      "Post-order DFS: return a node if it equals p or q; when both children return non-null the current node is the LCA (split point). O(n) time.",
    difficulty: "Medium",
    tags: ["Tree", "DFS", "LCA"],
    accent: "#cba6f7",
    component: LCABinaryTree,
  },
  {
    number: "230",
    title: "Kth Smallest Element in a BST",
    slug: "kth-smallest-element-in-a-bst",
    description:
      "Inorder DFS produces sorted values; stop after the k-th visit. O(k) time on average. Visualises the traversal order with numbered badges.",
    difficulty: "Medium",
    tags: ["Tree", "DFS", "BST", "Inorder"],
    accent: "#89b4fa",
    component: KthSmallest,
  },
  {
    number: "435",
    title: "Non-overlapping Intervals",
    slug: "non-overlapping-intervals",
    description:
      "Greedy: sort by end time, keep each non-overlapping interval and skip the rest. Minimum removals = total − kept. O(n log n) time.",
    difficulty: "Medium",
    tags: ["Greedy", "Intervals", "Sorting"],
    accent: "#f9e2af",
    component: NonOverlappingIntervals,
  },
  {
    number: "647",
    title: "Palindromic Substrings",
    slug: "palindromic-substrings",
    description:
      "Expand around each center (odd and even) counting palindromes. O(n²) time, O(1) extra space. Visualises L/R expansion with found palindromes.",
    difficulty: "Medium",
    tags: ["String", "DP", "Two Pointers"],
    accent: "#cba6f7",
    component: PalindromicSubstrings,
  },
  {
    number: 78,
    title: "Subsets",
    description: "Return all possible subsets of a given integer array.",
    difficulty: "Medium",
    tags: ["Array", "Backtracking", "Bit Manipulation"],
    accent: "#89dceb",
    component: Subsets,
  },
  {
    number: 46,
    title: "Permutations",
    description: "Return all possible permutations of a distinct integer array.",
    difficulty: "Medium",
    tags: ["Array", "Backtracking"],
    accent: "#fab387",
    component: Permutations,
  },
  {
    number: 572,
    title: "Subtree of Another Tree",
    description: "Check whether subRoot is a subtree of root.",
    difficulty: "Easy",
    tags: ["Tree", "DFS", "String Matching"],
    accent: "#a6e3a1",
    component: SubtreeOfAnotherTree,
  },
  {
    number: 105,
    title: "Construct Binary Tree from Preorder and Inorder Traversal",
    description: "Build a binary tree given preorder and inorder traversal arrays.",
    difficulty: "Medium",
    tags: ["Array", "Tree", "Divide and Conquer"],
    accent: "#89b4fa",
    component: ConstructBinaryTree,
  },
  {
    number: 124,
    title: "Binary Tree Maximum Path Sum",
    description: "Find the maximum path sum in a binary tree.",
    difficulty: "Hard",
    tags: ["Tree", "DFS", "DP"],
    accent: "#f38ba8",
    component: BinaryTreeMaxPath,
  },
  {
    number: 125,
    title: "Valid Palindrome",
    description: "Determine if a string is a palindrome considering only alphanumeric characters.",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"],
    accent: "#89dceb",
    component: ValidPalindrome,
  },
  {
    number: 271,
    title: "Encode and Decode Strings",
    description: "Design an algorithm to encode and decode a list of strings.",
    difficulty: "Medium",
    tags: ["Array", "String", "Design"],
    accent: "#fab387",
    component: EncodeDecodeStrings,
  },
  {
    number: 295,
    title: "Find Median from Data Stream",
    description: "Design a data structure that supports adding numbers and finding the median.",
    difficulty: "Hard",
    tags: ["Heap", "Design", "Two Pointers"],
    accent: "#f38ba8",
    component: FindMedianDataStream,
  },
  {
    number: 424,
    title: "Longest Repeating Character Replacement",
    description: "Find the length of the longest substring with at most k replacements.",
    difficulty: "Medium",
    tags: ["Sliding Window", "String"],
    accent: "#a6e3a1",
    component: LongestRepeatingCharReplace,
  },
  {
    number: 560,
    title: "Subarray Sum Equals K",
    description: "Find the total number of subarrays whose sum equals k.",
    difficulty: "Medium",
    tags: ["Array", "Hash Map", "Prefix Sum"],
    accent: "#cba6f7",
    component: SubarraySumEqualsK,
  },
  {
    id: "lc-347",
    number: 347,
    title: "Top K Frequent Elements",
    description: "Return the k most frequent elements from an integer array using bucket sort.",
    difficulty: "Medium",
    tags: ["Array", "Hash Map", "Bucket Sort", "Heap"],
    accent: "#cba6f7",
    component: TopKFrequent,
  },
  {
    id: "lc-22",
    number: 22,
    title: "Generate Parentheses",
    description: "Generate all combinations of well-formed parentheses for n pairs.",
    difficulty: "Medium",
    tags: ["String", "Backtracking"],
    accent: "#89b4fa",
    component: GenerateParentheses,
  },
  {
    id: "lc-17",
    number: 17,
    title: "Letter Combinations of a Phone Number",
    description: "Return all possible letter combinations a digit string could represent.",
    difficulty: "Medium",
    tags: ["String", "Hash Map", "Backtracking"],
    accent: "#fab387",
    component: LetterCombinations,
  },
  {
    id: "lc-239",
    number: 239,
    title: "Sliding Window Maximum",
    description: "Return the maximum value in each sliding window of size k using a monotonic deque.",
    difficulty: "Hard",
    tags: ["Array", "Sliding Window", "Deque", "Monotonic Queue"],
    accent: "#f9e2af",
    component: SlidingWindowMaximum,
  },
  {
    id: "lc-150",
    number: 150,
    title: "Evaluate Reverse Polish Notation",
    description: "Evaluate the value of an arithmetic expression in Reverse Polish Notation using a stack.",
    difficulty: "Medium",
    tags: ["Array", "Stack", "Math"],
    accent: "#a6e3a1",
    component: EvalRPN,
  },
  {
    id: "lc-48",
    number: 48,
    title: "Rotate Image",
    description: "Rotate an n×n matrix 90° clockwise in-place using transpose then reverse.",
    difficulty: "Medium",
    tags: ["Array", "Matrix", "Math"],
    accent: "#f9e2af",
    component: RotateImage,
  },
  {
    id: "lc-73",
    number: 73,
    title: "Set Matrix Zeroes",
    description: "If an element is 0, set its entire row and column to 0 in-place.",
    difficulty: "Medium",
    tags: ["Array", "Matrix", "Hash Set"],
    accent: "#f38ba8",
    component: SetMatrixZeroes,
  },
  {
    id: "lc-74",
    number: 74,
    title: "Search a 2D Matrix",
    description: "Binary search on a sorted m×n matrix treated as a flattened 1D array.",
    difficulty: "Medium",
    tags: ["Array", "Binary Search", "Matrix"],
    accent: "#cba6f7",
    component: Search2DMatrix,
  },
  {
    id: "lc-143",
    number: 143,
    title: "Reorder List",
    description: "Reorder a linked list to L0→Ln→L1→Ln-1→… using find-middle, reverse, and merge.",
    difficulty: "Medium",
    tags: ["Linked List", "Two Pointers", "Stack"],
    accent: "#89dceb",
    component: ReorderList,
  },
  {
    id: "lc-131",
    number: 131,
    title: "Palindrome Partitioning",
    description: "Return all ways to partition a string such that every substring is a palindrome.",
    difficulty: "Medium",
    tags: ["String", "Backtracking", "DP"],
    accent: "#cba6f7",
    component: PalindromePartitioning,
  },
  {
    id: "insert-interval",
    number: 57,
    title: "Insert Interval",
    description: "Insert a new interval into a list of non-overlapping intervals and merge if necessary.",
    difficulty: "Medium",
    tags: ["Array", "Intervals"],
    accent: "#fab387",
    component: InsertInterval,
  },
  {
    id: "sort-colors",
    number: 75,
    title: "Sort Colors",
    description: "Sort an array of 0s, 1s, and 2s in-place using the Dutch National Flag algorithm.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Sorting"],
    accent: "#89b4fa",
    component: SortColors,
  },
  {
    id: "copy-list-random",
    number: 138,
    title: "Copy List with Random Pointer",
    description: "Deep copy a linked list where each node has a random pointer to any node or null.",
    difficulty: "Medium",
    tags: ["Linked List", "Hash Map"],
    accent: "#89dceb",
    component: CopyListRandom,
  },
  {
    id: "sort-list",
    number: 148,
    title: "Sort List",
    description: "Sort a linked list in O(n log n) time using merge sort.",
    difficulty: "Medium",
    tags: ["Linked List", "Sorting", "Divide and Conquer"],
    accent: "#a6e3a1",
    component: SortList,
  },
  {
    id: "decode-string",
    number: 394,
    title: "Decode String",
    description: "Decode an encoded string where k[encoded_string] means the string is repeated k times.",
    difficulty: "Medium",
    tags: ["String", "Stack", "Recursion"],
    accent: "#cba6f7",
    component: DecodeString,
  },
];

const IMPLEMENTED_BY_NUMBER = new Map(
  IMPLEMENTED_PROBLEMS.map((problem) => [problem.number, problem]),
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

function ProblemPage({ problem, onBack, layoutWidth, onLayoutChange }) {
  const Component = problem.component;
  return (
    <motion.div
      className="problem-page"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: "spring", stiffness: 320, damping: 35 }}
    >
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
            <Component problem={problem} />
          ) : (
            <ProblemScaffold problem={problem} />
          )}
        </ErrorBoundary>
      </div>
    </motion.div>
  );
}

function HomePage({
  track,
  onTrackChange,
  onSelect,
  layoutWidth,
  onLayoutChange,
}) {
  const [catalogProblems, setCatalogProblems] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("All");
  const [activeTag, setActiveTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(60);

  const isLeetCodeTrack = track === TRACKS.LEETCODE;

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
    return isLeetCodeTrack
      ? buildCatalogProblems(catalogProblems)
      : BASICS_PROBLEMS;
  }, [catalogProblems, isLeetCodeTrack]);

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

  return (
    <motion.div
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="home-header">
        <div className="home-header-row">
          <motion.div
            className="brand"
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 280 }}
          >
            <div className="brand-icon">⟨/⟩</div>
            <div>
              <h1>CP Visualizer</h1>
              <p>
                {isLeetCodeTrack
                  ? "LeetCode and interview patterns"
                  : "Core programming basics and loop patterns"}
              </p>
            </div>
          </motion.div>

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
          </div>

          <LayoutControls layoutWidth={layoutWidth} onChange={onLayoutChange} />
        </div>

        <div className="catalog-meta">
          <span>
            {isLeetCodeTrack
              ? `Total catalog: ${allProblems.length}`
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
              Basics track includes foundational loop visualizations.
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
        {visible.map((p, i) => (
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
        ))}
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
    </motion.div>
  );
}

/* ── Root App ────────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState(null);
  const [track, setTrack] = useState(TRACKS.LEETCODE);
  const [layoutWidth, setLayoutWidth] = useState("full");

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

  return (
    <div className={`app layout-${layoutWidth}`}>
      <AnimatePresence mode="wait">
        {active ? (
          <ProblemPage
            key={active.id}
            problem={active}
            onBack={goBack}
            layoutWidth={layoutWidth}
            onLayoutChange={setLayoutWidth}
          />
        ) : (
          <HomePage
            key={`home-${track}`}
            track={track}
            onTrackChange={handleTrackChange}
            onSelect={setActive}
            layoutWidth={layoutWidth}
            onLayoutChange={setLayoutWidth}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
