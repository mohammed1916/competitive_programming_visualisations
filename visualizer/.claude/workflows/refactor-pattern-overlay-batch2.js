export const meta = {
  name: 'refactor-pattern-overlay-batch2',
  description: 'Add pattern overlay support to next 30 problem visualizers (batch 2)',
  phases: [
    { title: 'Refactor', detail: 'Apply pattern overlay to 30 problems in parallel' },
    { title: 'Verify', detail: 'Build and lint verification' },
  ],
};

phase('Refactor');

// Next 30 problem visualizers (problems 31-60)
const problemFiles = [
  'src/problems/TrappingRainWater/TrappingRainWaterVisualizer.jsx',
  'src/problems/TextJustification/TextJustificationVisualizer.jsx',
  'src/problems/ThreeSum/ThreeSumVisualizer.jsx',
  'src/problems/SubstringConcatenation/SubstringConcatenationVisualizer.jsx',
  'src/problems/SubtreeOfAnotherTree/SubtreeVisualizer.jsx',
  'src/problems/SudokuSolver/SudokuSolverVisualizer.jsx',
  'src/problems/SubarraySumEqualsK/SubarraySumKVisualizer.jsx',
  'src/problems/Subsets/SubsetsVisualizer.jsx',
  'src/problems/StringToIntegerAtoi/AtoiVisualizer.jsx',
  'src/problems/StringToIntegerAtoi/StringToIntegerAtoiVisualizer.jsx',
  'src/problems/SortColors/SortColorsVisualizer.jsx',
  'src/problems/SortList/SortListVisualizer.jsx',
  'src/problems/SpiralMatrix/SpiralMatrixVisualizer.jsx',
  'src/problems/SingleNumber/SingleNumberVisualizer.jsx',
  'src/problems/SkylineProblem/SkylineProblemVisualizer.jsx',
  'src/problems/SlidingWindowMaximum/SlidingWindowMaxVisualizer.jsx',
  'src/problems/SearchInRotatedSortedArray/SearchInRotatedSortedArrayVisualizer.jsx',
  'src/problems/SerializeDeserialize/SerializeDeserializeVisualizer.jsx',
  'src/problems/SetMatrixZeroes/SetMatrixZeroesVisualizer.jsx',
  'src/problems/RottingOranges/RottingOrangesVisualizer.jsx',
  'src/problems/Search2DMatrix/Search2DMatrixVisualizer.jsx',
  'src/problems/RightSideView/RightSideViewVisualizer.jsx',
  'src/problems/RotateArray/RotateArrayVisualizer.jsx',
  'src/problems/RotateImage/RotateImageVisualizer.jsx',
  'src/problems/ReverseLinkedList/ReverseLinkedListVisualizer.jsx',
  'src/problems/ReverseString/ReverseStringVisualizer.jsx',
  'src/problems/ReverseBits/ReverseBitsVisualizer.jsx',
  'src/problems/ReverseInteger/ReverseIntegerVisualizer.jsx',
  'src/problems/ReverseKGroup/ReverseKGroupVisualizer.jsx',
  'src/problems/RemoveNthNode/RemoveNthNodeVisualizer.jsx',
];

log(`Refactoring batch 2: ${problemFiles.length} problem visualizers in parallel...`);

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

log(`Refactored ${refactorResults.filter(Boolean).length}/${problemFiles.length} visualizers in batch 2`);

phase('Verify');

const verifyResult = await agent(
  `Verify the refactoring by running: npx vite build --logLevel error

Report: Did the build succeed? List any build errors found.`,
  {
    label: 'verify:build-batch2',
    phase: 'Verify',
  }
);

return {
  batch: 2,
  refactored: problemFiles.length,
  successful: refactorResults.filter(Boolean).length,
  buildResult: verifyResult,
};
