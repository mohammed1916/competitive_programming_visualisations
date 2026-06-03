import fs from "fs";
import path from "path";

const workspace = path.resolve("./");
const problemsDir = path.join(workspace, "src", "problems");
// We no longer rely on implementedProblems.js contents because the app
// auto-generates the catalog at build time via import.meta.glob. Only
// verify filesystem folders here.
const implementedFile = path.join(
  workspace,
  "src",
  "data",
  "implementedProblems.js",
);

const userList = `AddTwoNumbers, GameOnGrowingTree, MaxPointsOnALine, RightSideView, BalancedBinaryTree, GasStation, MaxProductSubarray, RotateArray, BasicCalculator, GenerateParentheses, MedianOfTwoSortedArrays, RotateImage, BestTimeBuySellStock, GroupAnagrams, MergeIntervals, RottingOranges, BestTimeBuySellStockIII, HappyNumber, MergeKSortedLists, Search2DMatrix, BestTimeBuySellStockIV, HouseRobber, MergeSortedArray, SearchInRotatedSortedArray, BinarySearch, HouseRobberII, MergeTwoSortedLists, SerializeDeserialize, BinaryTreeLevelOrder, ImplementTrie, MinimumWindowSubstring, SetMatrixZeroes, BinaryTreeMaxPath, InsertInterval, MinSizeSubarraySum, SingleNumber, BurstBalloons, InterleavingString, MinStack, SkylineProblem, Candy, IntersectionTwoLinkedLists, MissingNumber, SlidingWindowMaximum, ClimbingStairs, InvertBinaryTree, MoveZeroes, SortColors, CloneGraph, IPO, NextPermutation, SortList, CoinChange, JumpGame, NonOverlappingIntervals, SpiralMatrix, CombinationSum, JumpGameII, NQueens, StringToIntegerAtoi, ConstructBinaryTree, KthLargestElement, NumberOf1Bits, SubarraySumEqualsK, ContainerWithMostWater, KthSmallest, NumberOfIslands, Subsets, ContainsDuplicate, LargestRectangleInHistogram, PalindromeLinkedList, SubstringConcatenation, CopyListRandom, LCABinaryTree, PalindromeNumber, SubtreeOfAnotherTree, CountingBits, LCABST, PalindromePartitioning, SudokuSolver, CourseSchedule, LCS, PalindromePartitioningII, TextJustification, CourseScheduleII, LengthOfLastWord, PalindromicSubstrings, ThreeSum, DailyTemperatures, LetterCombinations, PartitionEqualSubset, TopKFrequent, DecodeString, LFUCache, PascalsTriangle, TrappingRainWater, DecodeWays, LinkedListCycle, PermutationInString, TwoSum, DiameterBinaryTree, LongestConsecutiveSequence, Permutations, TwoSumII, DistinctSubsequences, LongestIncreasingPath, PlusOne, UniquePaths, DungeonGame, LongestIncreasingSubsequence, ProductOfArrayExceptSelf, ValidAnagram, EditDistance, LongestPalindrome, RandomizedCollection, ValidateBST, EncodeDecodeStrings, LongestRepeatingCharReplace, RedundantConnection, ValidPalindrome, EvalRPN, LongestSubstringWithoutRepeating, RemoveDuplicates, ValidParentheses, FindAllAnagrams, LRUCache, RemoveNthNode, ValidSudoku, FindDuplicate, MajorityElement, ReorderList, WildcardMatching, FindMedianDataStream, MatrixIterationBasics, ReverseBits, WordBreak, FindMinRotatedSortedArray, MaxDepthBinaryTree, ReverseInteger, WordLadder, FindPeakElement, MaximalRectangle, ReverseKGroup, WordSearch, FirstMissingPositive, MaximumGap, ReverseLinkedList, WordSearchII, FlattenBinaryTree, MaximumSubarray, ReverseString, ZigzagConversion`;

const userNames = userList.split(",").map((s) => s.trim());

const folders = fs
  .readdirSync(problemsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const missingFolders = [];
for (const name of userNames) {
  if (!folders.includes(name)) missingFolders.push(name);
}

console.log("folders_count", folders.length);
console.log("missingFolders:", missingFolders);
process.exit(0);
// If you want to validate metadata presence in modules, run a Vite-aware
// build-time check that imports modules and inspects exported `meta`.
// For now we only verify the filesystem.
