export const meta = {
  name: 'refactor-dockable-panels-resume-batch1',
  description: 'Resume DockableWorkspace refactoring - remaining problems batch 1',
  phases: [
    { title: 'Refactor', detail: 'Apply dockable panels to remaining 20 problems' },
    { title: 'Verify', detail: 'Build verification' },
  ],
};

phase('Refactor');

// Remaining problems from batch 1 (excluding already completed: BalancedBinaryTree, BinaryTreeLevelOrder, BinaryTreeMaxPath, ConstructBinaryTree, DailyTemperatures, LRUCache)
const problemFiles = [
  'src/problems/PartitionEqualSubset/PartitionEqualSubsetVisualizer.jsx',
  'src/problems/PalindromePartitioning/PalindromePartitioningVisualizer.jsx',
  'src/problems/Permutations/PermutationsVisualizer.jsx',
  'src/problems/SubarraySumEqualsK/SubarraySumKVisualizer.jsx',
  'src/problems/Subsets/SubsetsVisualizer.jsx',
  'src/problems/UniquePaths/UniquePathsVisualizer.jsx',
  'src/problems/WordBreak/WordBreakVisualizer.jsx',
  'src/problems/ZigzagConversion/ZigzagVisualizer.jsx',
  'src/problems/ClimbingStairs/ClimbingStairsVisualizer.jsx',
  'src/problems/LongestIncreasingPath/LongestIncreasingPathVisualizer.jsx',
  'src/problems/LongestIncreasingSubsequence/LongestIncreasingSubsequenceVisualizer.jsx',
  'src/problems/LCABST/LCABSTVisualizer.jsx',
  'src/problems/LCABinaryTree/LCABinaryTreeVisualizer.jsx',
  'src/problems/LFUCache/LFUCacheVisualizer.jsx',
  'src/problems/NumberOfIslands/NumberOfIslandsVisualizer.jsx',
  'src/problems/EditDistance/EditDistanceVisualizer.jsx',
  'src/problems/NQueens/NQueensVisualizer.jsx',
  'src/problems/LongestConsecutiveSequence/LongestConsecutiveVisualizer.jsx',
  'src/problems/DungeonGame/DungeonGameVisualizer.jsx',
  'src/problems/CoinChange/CoinChangeVisualizer.jsx',
];

log(`Refactoring remaining batch 1: ${problemFiles.length} visualizers...`);

const refactorResults = await parallel(
  problemFiles.map((filePath) => () =>
    agent(
      `Refactor ${filePath} to use DockableWorkspace + FloatingPanel.

QUICK REFERENCE - Use this exact pattern:

1. Add imports:
   \`\`\`js
   import DockableWorkspace from '../../components/shared/DockableWorkspace';
   import FloatingPanel from '../../components/shared/FloatingPanel';
   import PlaybackControls from '../../components/PlaybackControls';
   import { useAutoScroll } from '../../hooks/useAutoScroll';
   import { usePatternOverlay } from '../../hooks/usePatternOverlay';
   import PatternOverlay from '../../components/PatternOverlay';
   \`\`\`

2. Add hooks in component:
   \`\`\`js
   const [autoScrollCode, setAutoScrollCode] = useAutoScroll();
   const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
   \`\`\`

3. Create dockPanels array:
   \`\`\`js
   const dockPanels = [
     {
       id: 'code',
       title: 'Code',
       content: <CodeTracePanel step={step} onActiveLineDomChange={setActiveLineDom} autoScroll={autoScrollCode} />,
     },
     {
       id: 'viz',
       title: 'Visualization',
       content: <YourVizComponent step={step} />,
     },
   ];
   \`\`\`

4. Replace main JSX:
   \`\`\`js
   return (
     <div className="problem-shell">
       <DockableWorkspace panels={dockPanels} initialLayout={{ rows: [['code', 'viz']], minimized: [] }} />
       <FloatingPanel title="Playback Controls">
         <PlaybackControls {...allProps} autoScroll={autoScrollCode} onAutoScrollChange={setAutoScrollCode} showAutoScroll
           showPatternOverlay={showPatternOverlay} onShowPatternOverlayChange={setShowPatternOverlay} showPatternOverlayToggle />
       </FloatingPanel>
       {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
     </div>
   );
   \`\`\`

Return summary of changes.`,
      {
        label: `refactor:${filePath.split('/')[2]}`,
        phase: 'Refactor',
      }
    )
  )
);

log(`Refactored ${refactorResults.filter(Boolean).length}/${problemFiles.length}`);

phase('Verify');

const verifyResult = await agent(
  `Run: npx vite build --logLevel error

Report: Build success or errors?`,
  { label: 'verify:build-resume-b1', phase: 'Verify' }
);

return { batch: 'resume-1', refactored: problemFiles.length, successful: refactorResults.filter(Boolean).length, buildResult: verifyResult };
