export const meta = {
  name: 'refactor-dockable-panels-resume-batch2',
  description: 'Resume DockableWorkspace refactoring - remaining problems batch 2',
  phases: [
    { title: 'Refactor', detail: 'Apply dockable panels to remaining 20 problems' },
    { title: 'Verify', detail: 'Build verification' },
  ],
};

phase('Refactor');

// Remaining problems from batch 2 (excluding: CloneGraph, EditDistance, FindDuplicate, ImplementTrie, InterleavingString)
const problemFiles = [
  'src/problems/GenerateParentheses/GenerateParenthesesVisualizer.jsx',
  'src/problems/GroupAnagrams/GroupAnagramsVisualizer.jsx',
  'src/problems/HouseRobberII/HouseRobberIIVisualizer.jsx',
  'src/problems/JumpGameII/JumpGameIIVisualizer.jsx',
  'src/problems/KthLargestElement/KthLargestElementVisualizer.jsx',
  'src/problems/LCS/LCSVisualizer.jsx',
  'src/problems/LinkedListCycle/LinkedListCycleVisualizer.jsx',
  'src/problems/LongestRepeatingCharReplace/LongestRepeatingVisualizer.jsx',
  'src/problems/MatrixIterationBasics/MatrixIterationBasicsVisualizer.jsx',
  'src/problems/MaxPointsOnALine/MaxPointsOnALineVisualizer.jsx',
  'src/problems/MergeKSortedLists/MergeKSortedListsVisualizer.jsx',
  'src/problems/MinStack/MinStackVisualizer.jsx',
  'src/problems/MoveZeroes/MoveZeroesVisualizer.jsx',
  'src/problems/NextPermutation/NextPermutationVisualizer.jsx',
  'src/problems/PalindromeLinkedList/PalindromeLinkedListVisualizer.jsx',
  'src/problems/ReverseLinkedList/ReverseLinkedListVisualizer.jsx',
  'src/problems/SymmetricTree/SymmetricTreeVisualizer.jsx',
  'src/problems/DailyTemperatures/DailyTemperaturesVisualizer.jsx',
  'src/problems/InvertBinaryTree/InvertBinaryTreeVisualizer.jsx',
  'src/problems/InsertInterval/InsertIntervalVisualizer.jsx',
];

log(`Refactoring remaining batch 2: ${problemFiles.length} visualizers...`);

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
  { label: 'verify:build-resume-b2', phase: 'Verify' }
);

return { batch: 'resume-2', refactored: problemFiles.length, successful: refactorResults.filter(Boolean).length, buildResult: verifyResult };
