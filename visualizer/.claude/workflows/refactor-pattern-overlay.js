export const meta = {
  name: 'refactor-pattern-overlay',
  description: 'Add pattern overlay support to problem visualizers',
  phases: [
    { title: 'Analyze', detail: 'Identify visualizers to refactor' },
    { title: 'Refactor', detail: 'Apply pattern overlay to 30 problems in parallel' },
    { title: 'Verify', detail: 'Build and lint verification' },
  ],
};

phase('Analyze');

// Get first 30 problem visualizers that need refactoring
const problemFiles = [
  'src/problems/AddSearchWords/AddSearchWordsVisualizer.jsx',
  'src/problems/GuessNumber/GuessNumberVisualizer.jsx',
  'src/problems/MinCostClimbingStairs/MinCostClimbingStairsVisualizer.jsx',
  'src/problems/FindDisappearedNumbers/FindDisappearedNumbersVisualizer.jsx',
  'src/problems/MaximalRectangle/MaximalRectangleVisualizer.jsx',
  'src/problems/ReverseVowels/ReverseVowelsVisualizer.jsx',
  'src/problems/SymmetricTree/SymmetricTreeVisualizer.jsx',
  'src/problems/CarFleet/CarFleet.jsx',
  'src/problems/MultiplyStrings/MultiplyStrings.jsx',
  'src/problems/KthSmallestMatrix/KthSmallestMatrixVisualizer.jsx',
  'src/problems/SwimInRisingWater/SwimInRisingWaterVisualizer.jsx',
  'src/problems/PacificAtlantic/PacificAtlanticVisualizer.jsx',
  'src/problems/PowerOfTwo/PowerOfTwoVisualizer.jsx',
  'src/problems/SameTree/SameTreeVisualizer.jsx',
  'src/problems/FirstBadVersion/FirstBadVersionVisualizer.jsx',
  'src/problems/ZigzagConversion/ZigzagVisualizer.jsx',
  'src/problems/WordLadder/WordLadderVisualizer.jsx',
  'src/problems/WordSearch/WordSearchVisualizer.jsx',
  'src/problems/WordSearchII/WordSearchIIVisualizer.jsx',
  'src/problems/ValidateBST/ValidateBSTVisualizer.jsx',
  'src/problems/WildcardMatching/WildcardMatchingVisualizer.jsx',
  'src/problems/WordBreak/WordBreakVisualizer.jsx',
  'src/problems/ValidParentheses/ValidParenthesesVisualizer.jsx',
  'src/problems/ValidSudoku/ValidSudokuVisualizer.jsx',
  'src/problems/ValidAnagram/ValidAnagramVisualizer.jsx',
  'src/problems/ValidPalindrome/ValidPalindromeVisualizer.jsx',
  'src/problems/TwoSum/TwoSumVisualizer.jsx',
  'src/problems/TwoSumII/TwoSumIIVisualizer.jsx',
  'src/problems/UniquePaths/UniquePathsVisualizer.jsx',
  'src/problems/TopKFrequent/TopKFrequentVisualizer.jsx',
];

log(`Refactoring ${problemFiles.length} problem visualizers in parallel...`);

phase('Refactor');

const refactorResults = await parallel(
  problemFiles.map((filePath) => () =>
    agent(
      `Refactor ${filePath} to add pattern overlay support.

You MUST:
1. Import PatternOverlay from '../../components/PatternOverlay'
2. Import usePatternOverlay from '../../hooks/usePatternOverlay'
3. Add this line in the component: const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
4. Find the CodeTracePanel component and add prop: onActiveLineDomChange={setActiveLineDom}
5. Find the PlaybackControls component (or create one) and add these props:
   - showPatternOverlay={showPatternOverlay}
   - onShowPatternOverlayChange={setShowPatternOverlay}
   - patternOverlayLabel="Show pattern overlay"
   - showPatternOverlayToggle
6. Add this JSX before the closing tag: {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}

Do NOT modify test files or unrelated code. Only add the necessary imports, hooks, and props. Preserve all existing functionality.

Return a summary of changes made.`,
      {
        label: `refactor:${filePath.split('/')[2]}`,
        phase: 'Refactor',
      }
    )
  )
);

log(`Refactored ${refactorResults.filter(Boolean).length}/${problemFiles.length} visualizers`);

phase('Verify');

const verifyResult = await agent(
  `Verify the refactoring by running: npx vite build --logLevel error

Report: Did the build succeed? List any build errors found.`,
  {
    label: 'verify:build',
    phase: 'Verify',
  }
);

return {
  refactored: problemFiles.length,
  successful: refactorResults.filter(Boolean).length,
  buildResult: verifyResult,
};
