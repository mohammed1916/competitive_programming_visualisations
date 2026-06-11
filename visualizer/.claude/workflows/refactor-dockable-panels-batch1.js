export const meta = {
  name: 'refactor-dockable-panels-batch1',
  description: 'Add DockableWorkspace + FloatingPanel to problem visualizers (batch 1)',
  phases: [
    { title: 'Analyze', detail: 'Identify visualizers to refactor' },
    { title: 'Refactor', detail: 'Apply dockable panels to 25 problems in parallel' },
    { title: 'Verify', detail: 'Build verification' },
  ],
};

phase('Analyze');

// Problems that benefit most from dockable panels + floating controls
// Tree, Graph, DP problems that have multiple visualization needs
const problemFiles = [
  'src/problems/BalancedBinaryTree/BalancedBinaryTreeVisualizer.jsx',
  'src/problems/BinaryTreeLevelOrder/BinaryTreeLevelOrderVisualizer.jsx',
  'src/problems/BinaryTreeMaxPath/BTMaxPathVisualizer.jsx',
  'src/problems/CloneGraph/CloneGraphVisualizer.jsx',
  'src/problems/ConstructBinaryTree/ConstructBTVisualizer.jsx',
  'src/problems/CoinChange/CoinChangeVisualizer.jsx',
  'src/problems/DailyTemperatures/DailyTemperaturesVisualizer.jsx',
  'src/problems/EditDistance/EditDistanceVisualizer.jsx',
  'src/problems/LCABinaryTree/LCABinaryTreeVisualizer.jsx',
  'src/problems/LCABST/LCABSTVisualizer.jsx',
  'src/problems/LongestIncreasingSubsequence/LongestIncreasingSubsequenceVisualizer.jsx',
  'src/problems/LongestIncreasingPath/LongestIncreasingPathVisualizer.jsx',
  'src/problems/LongestConsecutiveSequence/LongestConsecutiveVisualizer.jsx',
  'src/problems/LRUCache/LRUCacheVisualizer.jsx',
  'src/problems/LFUCache/LFUCacheVisualizer.jsx',
  'src/problems/NQueens/NQueensVisualizer.jsx',
  'src/problems/NumberOfIslands/NumberOfIslandsVisualizer.jsx',
  'src/problems/PartitionEqualSubset/PartitionEqualSubsetVisualizer.jsx',
  'src/problems/PalindromePartitioning/PalindromePartitioningVisualizer.jsx',
  'src/problems/Permutations/PermutationsVisualizer.jsx',
  'src/problems/SubarraySumEqualsK/SubarraySumKVisualizer.jsx',
  'src/problems/Subsets/SubsetsVisualizer.jsx',
  'src/problems/UniquePaths/UniquePathsVisualizer.jsx',
  'src/problems/WordBreak/WordBreakVisualizer.jsx',
  'src/problems/ZigzagConversion/ZigzagVisualizer.jsx',
  'src/problems/ClimbingStairs/ClimbingStairsVisualizer.jsx',
];

log(`Refactoring ${problemFiles.length} visualizers to use DockableWorkspace + FloatingPanel...`);

phase('Refactor');

const refactorResults = await parallel(
  problemFiles.map((filePath) => () =>
    agent(
      `Refactor ${filePath} to use DockableWorkspace + FloatingPanel for playback controls.

IMPORTANT CONTEXT:
- This problem currently has CodeTracePanel for code visualization
- Look for any other visualization components (tree, graph, table, chart, animation, etc.)
- Convert to use DockableWorkspace for multi-panel layout + FloatingPanel for playback controls
- See GameOnGrowingTree as reference: src/problems/GameOnGrowingTree/GameOnGrowingTreeVisualizer.jsx

REFACTORING STEPS:

1. Import required components:
   \`\`\`js
   import DockableWorkspace from '../../components/shared/DockableWorkspace';
   import FloatingPanel from '../../components/shared/FloatingPanel';
   import PlaybackControls from '../../components/PlaybackControls';
   import { useAutoScroll } from '../../hooks/useAutoScroll';
   import { usePatternOverlay } from '../../hooks/usePatternOverlay';
   \`\`\`

2. Initialize hooks:
   \`\`\`js
   const [autoScrollCode, setAutoScrollCode] = useAutoScroll();
   const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
   \`\`\`

3. Create dockPanels array with CodeTracePanel and other visualizations:
   \`\`\`js
   const dockPanels = [
     {
       id: 'code',
       title: 'Code Trace',
       content: <CodeTracePanel step={step} onActiveLineDomChange={setActiveLineDom} autoScroll={autoScrollCode} />,
     },
     {
       id: 'viz',
       title: 'Visualization',
       content: <YourVisualizationComponent step={step} />,
     },
   ];
   \`\`\`

4. Replace JSX with:
   \`\`\`js
   return (
     <div className="problem-shell">
       <DockableWorkspace
         title={problemTitle}
         panels={dockPanels}
         initialLayout={{
           rows: [['code', 'viz']],
           minimized: [],
         }}
       />

       <FloatingPanel title="Playback Controls">
         <PlaybackControls
           onReset={handleReset}
           onPrev={stepBack}
           onPlayToggle={togglePlay}
           onNext={stepForward}
           resetDisabled={steps.length === 0}
           prevDisabled={stepIndex <= 0}
           nextDisabled={steps.length === 0 || isDone}
           isPlaying={isPlaying}
           isDone={isDone}
           speed={speed}
           onSpeedChange={(event) => setSpeed(Number(event.target.value))}
           speedIndicator={\`\${speed}ms\`}
           autoScroll={autoScrollCode}
           onAutoScrollChange={setAutoScrollCode}
           autoScrollLabel="Auto-scroll code"
           showAutoScroll
           showPatternOverlay={showPatternOverlay}
           onShowPatternOverlayChange={setShowPatternOverlay}
           patternOverlayLabel="Show pattern overlay"
           showPatternOverlayToggle
         />
       </FloatingPanel>

       {showPatternOverlay && step && (
         <PatternOverlay step={step} activeLineDom={activeLineDom} />
       )}
     </div>
   );
   \`\`\`

5. Remove old PlaybackControls if it was inline with CodeTracePanel
6. Adjust CSS/styling if needed for the new layout

If this visualizer doesn't have other visualizations besides CodeTracePanel, you can still convert to DockableWorkspace (it will just have one panel), but the FloatingPanel for controls is the key improvement.

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
    label: 'verify:build-dockable',
    phase: 'Verify',
  }
);

return {
  batch: 1,
  refactored: problemFiles.length,
  successful: refactorResults.filter(Boolean).length,
  buildResult: verifyResult,
};
