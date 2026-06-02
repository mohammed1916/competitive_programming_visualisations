import fs from "fs";
import path from "path";

const workspace = path.resolve("./");
const problemsDir = path.join(workspace, "src", "problems");
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
const implementedContent = fs.readFileSync(implementedFile, "utf8");

const missingFolders = [];
const missingInImplemented = [];

for (const name of userNames) {
  if (!folders.includes(name)) missingFolders.push(name);
  // detect explicit folder entries or presence in AUTO_FOLDERS list
  if (!implementedContent.includes(name)) missingInImplemented.push(name);
}

console.log("folders_count", folders.length);
console.log("missingFolders:", missingFolders);
console.log("missingInImplemented:", missingInImplemented);

// write missingInImplemented to a file for later patching
fs.writeFileSync(
  path.join(workspace, "scripts", "missing-implemented.json"),
  JSON.stringify(missingInImplemented, null, 2),
);

process.exit(0);
