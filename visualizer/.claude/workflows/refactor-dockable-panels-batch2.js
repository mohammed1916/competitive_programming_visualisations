export const meta = {
  name: 'refactor-dockable-panels-batch2',
  description: 'Add DockableWorkspace + FloatingPanel to problem visualizers (batch 2)',
  phases: [
    { title: 'Refactor', detail: 'Apply dockable panels to 25 more problems in parallel' },
    { title: 'Verify', detail: 'Build verification' },
  ],
};

phase('Refactor');

// Next 25 problems with visualization components
const problemFiles = [
  'src/problems/CloneGraph/CloneGraphVisualizer.jsx',
  'src/problems/CoinChange/CoinChangeVisualizer.jsx',
  'src/problems/DailyTemperatures/DailyTemperaturesVisualizer.jsx',
  'src/problems/EditDistance/EditDistanceVisualizer.jsx',
  'src/problems/FindDuplicate/FindDuplicateVisualizer.jsx',
  'src/problems/GenerateParentheses/GenerateParenthesesVisualizer.jsx',
  'src/problems/GroupAnagrams/GroupAnagramsVisualizer.jsx',
  'src/problems/HouseRobberII/HouseRobberIIVisualizer.jsx',
  'src/problems/ImplementTrie/ImplementTrieVisualizer.jsx',
  'src/problems/InterleavingString/InterleavingStringVisualizer.jsx',
  'src/problems/InvertBinaryTree/InvertBinaryTreeVisualizer.jsx',
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
];

log(`Refactoring batch 2: ${problemFiles.length} visualizers to use DockableWorkspace + FloatingPanel...`);

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

4. Replace JSX with DockableWorkspace + FloatingPanel (see batch 1 instructions for full template)

5. Remove old PlaybackControls if it was inline with CodeTracePanel

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
    label: 'verify:build-dockable-b2',
    phase: 'Verify',
  }
);

return {
  batch: 2,
  refactored: problemFiles.length,
  successful: refactorResults.filter(Boolean).length,
  buildResult: verifyResult,
};
