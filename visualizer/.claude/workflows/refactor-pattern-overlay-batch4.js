export const meta = {
  name: 'refactor-pattern-overlay-batch4',
  description: 'Add pattern overlay support to next 30 problem visualizers (batch 4)',
  phases: [
    { title: 'Refactor', detail: 'Apply pattern overlay to 30 problems in parallel' },
    { title: 'Verify', detail: 'Build and lint verification' },
  ],
};

phase('Refactor');

// Next 30 problem visualizers (problems 91-120)
const problemFiles = [
  'src/problems/MaximumSubarray/MaximumSubarrayVisualizer.jsx',
  'src/problems/MaxPointsOnALine/MaxPointsOnALineVisualizer.jsx',
  'src/problems/MaxProductSubarray/MaxProductSubarrayVisualizer.jsx',
  'src/problems/MatrixIterationBasics/MatrixIterationBasicsVisualizer.jsx',
  'src/problems/LongestSubstringWithoutRepeating/LongestSubstringWithoutRepeatingVisualizer.jsx',
  'src/problems/MajorityElement/MajorityElementVisualizer.jsx',
  'src/problems/LongestPalindrome/PalindromeVisualizer.jsx',
  'src/problems/LongestRepeatingCharReplace/LongestRepeatingVisualizer.jsx',
  'src/problems/LongestIncreasingSubsequence/LongestIncreasingSubsequenceVisualizer.jsx',
  'src/problems/LongestPalindrome/LongestPalindromeVisualizer.jsx',
  'src/problems/LongestConsecutiveSequence/LongestConsecutiveVisualizer.jsx',
  'src/problems/LongestIncreasingPath/LongestIncreasingPathVisualizer.jsx',
  'src/problems/LengthOfLastWord/LengthOfLastWordVisualizer.jsx',
  'src/problems/LetterCombinations/LetterCombinationsVisualizer.jsx',
  'src/problems/LinkedListCycle/LinkedListCycleVisualizer.jsx',
  'src/problems/LargestRectangleInHistogram/LargestRectangleInHistogramVisualizer.jsx',
  'src/problems/LRUCache/LRUCacheVisualizer.jsx',
  'src/problems/LCS/LCSVisualizer.jsx',
  'src/problems/LFUCache/LFUCacheVisualizer.jsx',
  'src/problems/KthSmallest/KthSmallestVisualizer.jsx',
  'src/problems/LCABinaryTree/LCABinaryTreeVisualizer.jsx',
  'src/problems/LCABST/LCABSTVisualizer.jsx',
  'src/problems/JumpGame/JumpGameVisualizer.jsx',
  'src/problems/JumpGameII/JumpGameIIVisualizer.jsx',
  'src/problems/KthLargestElement/KthLargestElementVisualizer.jsx',
  'src/problems/IntersectionTwoLinkedLists/IntersectionTwoLinkedListsVisualizer.jsx',
  'src/problems/InvertBinaryTree/InvertBinaryTreeVisualizer.jsx',
  'src/problems/InsertInterval/InsertIntervalVisualizer.jsx',
  'src/problems/InterleavingString/InterleavingStringVisualizer.jsx',
  'src/problems/ImplementTrie/ImplementTrieVisualizer.jsx',
];

log(`Refactoring batch 4: ${problemFiles.length} problem visualizers in parallel...`);

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

log(`Refactored ${refactorResults.filter(Boolean).length}/${problemFiles.length} visualizers in batch 4`);

phase('Verify');

const verifyResult = await agent(
  `Verify the refactoring by running: npx vite build --logLevel error

Report: Did the build succeed? List any build errors found.`,
  {
    label: 'verify:build-batch4',
    phase: 'Verify',
  }
);

return {
  batch: 4,
  refactored: problemFiles.length,
  successful: refactorResults.filter(Boolean).length,
  buildResult: verifyResult,
};
