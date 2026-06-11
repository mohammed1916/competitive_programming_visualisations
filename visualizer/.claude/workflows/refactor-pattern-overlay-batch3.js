export const meta = {
  name: 'refactor-pattern-overlay-batch3',
  description: 'Add pattern overlay support to next 30 problem visualizers (batch 3)',
  phases: [
    { title: 'Refactor', detail: 'Apply pattern overlay to 30 problems in parallel' },
    { title: 'Verify', detail: 'Build and lint verification' },
  ],
};

phase('Refactor');

// Next 30 problem visualizers (problems 61-90)
const problemFiles = [
  'src/problems/ReorderList/ReorderListVisualizer.jsx',
  'src/problems/RandomizedCollection/RandomizedCollectionVisualizer.jsx',
  'src/problems/RedundantConnection/RedundantConnectionVisualizer.jsx',
  'src/problems/RemoveDuplicates/RemoveDuplicatesVisualizer.jsx',
  'src/problems/Permutations/PermutationsVisualizer.jsx',
  'src/problems/PlusOne/PlusOneVisualizer.jsx',
  'src/problems/ProductOfArrayExceptSelf/ProductOfArrayExceptSelfVisualizer.jsx',
  'src/problems/PascalsTriangle/PascalsTriangleVisualizer.jsx',
  'src/problems/PermutationInString/PermutationInStringVisualizer.jsx',
  'src/problems/PalindromicSubstrings/PalindromicSubstringsVisualizer.jsx',
  'src/problems/PartitionEqualSubset/PartitionEqualSubsetVisualizer.jsx',
  'src/problems/PalindromeNumber/PalindromeNumberVisualizer.jsx',
  'src/problems/PalindromePartitioning/PalindromePartitioningVisualizer.jsx',
  'src/problems/PalindromePartitioningII/PalindromePartitioningIIVisualizer.jsx',
  'src/problems/NumberOfIslands/NumberOfIslandsVisualizer.jsx',
  'src/problems/PalindromeLinkedList/PalindromeLinkedListVisualizer.jsx',
  'src/problems/NonOverlappingIntervals/NonOverlappingIntervalsVisualizer.jsx',
  'src/problems/NumberOf1Bits/NumberOf1BitsVisualizer.jsx',
  'src/problems/NextPermutation/NextPermutationVisualizer.jsx',
  'src/problems/NQueens/NQueensVisualizer.jsx',
  'src/problems/MissingNumber/MissingNumberVisualizer.jsx',
  'src/problems/MoveZeroes/MoveZeroesVisualizer.jsx',
  'src/problems/MinSizeSubarraySum/MinSizeSubarraySumVisualizer.jsx',
  'src/problems/MinStack/MinStackVisualizer.jsx',
  'src/problems/MergeKSortedLists/MergeKSortedListsVisualizer.jsx',
  'src/problems/MergeSortedArray/MergeSortedArrayVisualizer.jsx',
  'src/problems/MergeTwoSortedLists/MergeTwoSortedListsVisualizer.jsx',
  'src/problems/MedianOfTwoSortedArrays/MedianOfTwoSortedArraysVisualizer.jsx',
  'src/problems/MergeIntervals/MergeIntervalsVisualizer.jsx',
  'src/problems/MaximumGap/MaximumGapVisualizer.jsx',
];

log(`Refactoring batch 3: ${problemFiles.length} problem visualizers in parallel...`);

const refactorResults = await parallel(
  problemFiles.map((filePath) => () =>
    agent(
      `Refactor ${filePath} to add pattern overlay support.

You MUST:
1. Import PatternOverlay from '../../components/PatternOverlay'
2. Import usePatternOverlay from '../../hooks/usePatternOverlay'
3. Add this line in the component: const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
4. Find the CodeTracePanel component and add prop: onActiveLineDomChange={setActiveLineDom}
5. Find the PlaybackControls component (or create one if missing) and add these props:
   - showPatternOverlay={showPatternOverlay}
   - onShowPatternOverlayChange={setShowPatternOverlay}
   - patternOverlayLabel="Show pattern overlay"
   - showPatternOverlayToggle
6. Add this JSX before the closing tag: {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}

If there is NO PlaybackControls in this visualizer, do NOT add one. Only add the PatternOverlay component and hook initialization. The pattern overlay will still work even without the toggle.

Do NOT modify test files or unrelated code. Only add the necessary imports, hooks, and props. Preserve all existing functionality.

Return a summary of changes made.`,
      {
        label: `refactor:${filePath.split('/')[2]}`,
        phase: 'Refactor',
      }
    )
  )
);

log(`Refactored ${refactorResults.filter(Boolean).length}/${problemFiles.length} visualizers in batch 3`);

phase('Verify');

const verifyResult = await agent(
  `Verify the refactoring by running: npx vite build --logLevel error

Report: Did the build succeed? List any build errors found.`,
  {
    label: 'verify:build-batch3',
    phase: 'Verify',
  }
);

return {
  batch: 3,
  refactored: problemFiles.length,
  successful: refactorResults.filter(Boolean).length,
  buildResult: verifyResult,
};
