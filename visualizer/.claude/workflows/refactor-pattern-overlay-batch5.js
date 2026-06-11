export const meta = {
  name: 'refactor-pattern-overlay-batch5',
  description: 'Add pattern overlay support to final 44 problem visualizers (batch 5)',
  phases: [
    { title: 'Refactor', detail: 'Apply pattern overlay to 44 remaining problems in parallel' },
    { title: 'Verify', detail: 'Build and lint verification' },
  ],
};

phase('Refactor');

// Final 44 problem visualizers (problems 121-164)
const problemFiles = [
  'src/problems/IPO/IPOVisualizer.jsx',
  'src/problems/HappyNumber/HappyNumberVisualizer.jsx',
  'src/problems/HouseRobberII/HouseRobberIIVisualizer.jsx',
  'src/problems/GenerateParentheses/GenerateParenthesesVisualizer.jsx',
  'src/problems/GroupAnagrams/GroupAnagramsVisualizer.jsx',
  'src/problems/GasStation/GasStationVisualizer.jsx',
  'src/problems/FindPeakElement/FindPeakElementVisualizer.jsx',
  'src/problems/FirstMissingPositive/FirstMissingPositiveVisualizer.jsx',
  'src/problems/FlattenBinaryTree/FlattenBinaryTreeVisualizer.jsx',
  'src/problems/FindMedianDataStream/FindMedianVisualizer.jsx',
  'src/problems/FindMinRotatedSortedArray/FindMinRotatedVisualizer.jsx',
  'src/problems/FindAllAnagrams/FindAllAnagramsVisualizer.jsx',
  'src/problems/FindDuplicate/FindDuplicateVisualizer.jsx',
  'src/problems/EncodeDecodeStrings/EncodeDecodeVisualizer.jsx',
  'src/problems/EvalRPN/EvalRPNVisualizer.jsx',
  'src/problems/DungeonGame/DungeonGameVisualizer.jsx',
  'src/problems/EditDistance/EditDistanceVisualizer.jsx',
  'src/problems/DecodeWays/DecodeWaysVisualizer.jsx',
  'src/problems/DiameterBinaryTree/DiameterBinaryTreeVisualizer.jsx',
  'src/problems/DistinctSubsequences/DistinctSubsequencesVisualizer.jsx',
  'src/problems/DailyTemperatures/DailyTemperaturesVisualizer.jsx',
  'src/problems/DecodeString/DecodeStringVisualizer.jsx',
  'src/problems/CourseScheduleII/CourseScheduleIIVisualizer.jsx',
  'src/problems/CopyListRandom/CopyListRandomVisualizer.jsx',
  'src/problems/CountingBits/CountingBitsVisualizer.jsx',
  'src/problems/ContainerWithMostWater/ContainerWithMostWaterVisualizer.jsx',
  'src/problems/ContainsDuplicate/ContainsDuplicateVisualizer.jsx',
  'src/problems/CombinationSum/CombinationSumVisualizer.jsx',
  'src/problems/ConstructBinaryTree/ConstructBTVisualizer.jsx',
  'src/problems/CloneGraph/CloneGraphVisualizer.jsx',
  'src/problems/CoinChange/CoinChangeVisualizer.jsx',
  'src/problems/Candy/CandyVisualizer.jsx',
  'src/problems/ClimbingStairs/ClimbingStairsVisualizer.jsx',
  'src/problems/BinaryTreeMaxPath/BTMaxPathVisualizer.jsx',
  'src/problems/BurstBalloons/BurstBalloonsVisualizer.jsx',
  'src/problems/BestTimeBuySellStockIV/BestTimeBuySellStockIVVisualizer.jsx',
  'src/problems/BinarySearch/BinarySearchVisualizer.jsx',
  'src/problems/BinaryTreeLevelOrder/BinaryTreeLevelOrderVisualizer.jsx',
  'src/problems/BestTimeBuySellStock/BestTimeBuySellStockVisualizer.jsx',
  'src/problems/BestTimeBuySellStockIII/BestTimeBuySellStockIIIVisualizer.jsx',
  'src/problems/AddTwoNumbers/AddTwoNumbersVisualizer.jsx',
  'src/problems/BalancedBinaryTree/BalancedBinaryTreeVisualizer.jsx',
  'src/problems/BasicCalculator/BasicCalculatorVisualizer.jsx',
];

log(`Refactoring batch 5 (final): ${problemFiles.length} problem visualizers in parallel...`);

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

log(`Refactored ${refactorResults.filter(Boolean).length}/${problemFiles.length} visualizers in batch 5 (final batch)`);

phase('Verify');

const verifyResult = await agent(
  `Verify the refactoring by running: npx vite build --logLevel error

Report: Did the build succeed? List any build errors found.`,
  {
    label: 'verify:build-batch5',
    phase: 'Verify',
  }
);

return {
  batch: 5,
  final: true,
  refactored: problemFiles.length,
  successful: refactorResults.filter(Boolean).length,
  buildResult: verifyResult,
};
