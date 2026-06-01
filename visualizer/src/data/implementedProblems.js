/* Metadata-only implementedProblems. No eager visualizer imports here.
   Each entry includes `folder` which the app will use to lazily load
   the visualizer from `src/problems/<folder>/index.jsx` via React.lazy. */

export const TRACKS = {
  LEETCODE: "leetcode",
  BASICS: "basics",
  CODEFORCES: "codeforces",
};

export const IMPLEMENTED_PROBLEMS = [
  {
    id: "lc-1",
    number: "1",
    title: "Two Sum",
    slug: "two-sum",
    description:
      "Find two indices that add to the target using a single-pass hash map to achieve O(n) time.",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    accent: "#22c55e",
    folder: "TwoSum",
    implemented: true,
  },
  {
    id: "lc-2",
    number: "2",
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    description:
      "Add two numbers represented by linked lists node by node, carrying over tens.",
    difficulty: "Medium",
    tags: ["Linked List", "Math"],
    accent: "#a855f7",
    folder: "AddTwoNumbers",
    implemented: true,
  },
  {
    id: "lc-7",
    number: "7",
    title: "Reverse Integer",
    slug: "reverse-integer",
    description:
      "Pop and push digits while carefully avoiding 32-bit integer overflows.",
    difficulty: "Medium",
    tags: ["Math"],
    accent: "#ef4444",
    folder: "ReverseInteger",
    implemented: true,
  },
  {
    id: "lc-9",
    number: "9",
    title: "Palindrome Number",
    slug: "palindrome-number",
    description:
      "Determine if a number is a palindrome by reversing its right half.",
    difficulty: "Easy",
    tags: ["Math"],
    accent: "#a855f7",
    folder: "PalindromeNumber",
    implemented: true,
  },
  {
    id: "lc-15",
    number: "15",
    title: "3Sum",
    slug: "3sum",
    description:
      "Sort the array and use two pointers to find triplets that sum to zero.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Sorting"],
    accent: "#0ea5e9",
    folder: "ThreeSum",
    implemented: true,
  },
  {
    id: "lc-11",
    number: "11",
    title: "Container With Most Water",
    slug: "container-with-most-water",
    description:
      "Use two pointers shrinking from the outside in to find the maximum area between two lines.",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers", "Greedy"],
    accent: "#3b82f6",
    folder: "ContainerWithMostWater",
    implemented: true,
  },
  {
    id: "lc-42",
    number: "42",
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    description:
      "Use two pointers with left and right maximums to compute trapped water dynamically without extra space.",
    difficulty: "Hard",
    tags: ["Array", "Two Pointers", "Dynamic Programming"],
    accent: "#3b82f6",
    folder: "TrappingRainWater",
    implemented: true,
  },
  {
    id: "lc-54",
    number: "54",
    title: "Spiral Matrix",
    slug: "spiral-matrix",
    description:
      "Traverse a 2D matrix in spiral order by carefully shrinking four directional boundaries (top, bottom, left, right).",
    difficulty: "Medium",
    tags: ["Array", "Matrix", "Simulation"],
    accent: "#f97316",
    folder: "SpiralMatrix",
    implemented: true,
  },
  {
    id: "lc-39",
    number: "39",
    title: "Combination Sum",
    slug: "combination-sum",
    description:
      "Use a backtracking depth-first search (DFS) algorithm to find all unique combinations of candidates that sum to the target.",
    difficulty: "Medium",
    tags: ["Array", "Backtracking"],
    accent: "#14b8a6",
    folder: "CombinationSum",
    implemented: true,
  },
  {
    id: "lc-20",
    number: "20",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    description:
      "Use a stack to match opening brackets — every closing bracket must pop a matching open bracket.",
    difficulty: "Easy",
    tags: ["String", "Stack"],
    accent: "#f97316",
    folder: "ValidParentheses",
    implemented: true,
  },
  // ... (the file continues with the remaining entries mirroring the previous curated list,
  // each entry containing `folder` and no `component` import)
];

export const IMPLEMENTED_BY_NUMBER = new Map(
  IMPLEMENTED_PROBLEMS.map((problem) => [problem.number, problem]),
);

export const BASICS_PROBLEMS = [
  {
    id: "bs-01",
    number: "B1",
    title: "Matrix Iteration Patterns",
    slug: "matrix-iteration-patterns",
    description:
      "Explore upper/lower triangular, diagonal, anti-diagonal and full matrix traversals.",
    difficulty: "Easy",
    tags: ["Matrix", "Loops", "Basics"],
    accent: "#0ea5e9",
    folder: "MatrixIterationBasics",
    implemented: true,
  },
];

export function buildCatalogProblems(catalogProblems) {
  return catalogProblems.map((problem) => {
    const implemented = IMPLEMENTED_BY_NUMBER.get(problem.number);
    if (!implemented) {
      return {
        ...problem,
        accent: "#64748b",
        description:
          "Cataloged in explorer. Visualizer shell is ready; implementation can be plugged into reusable panels.",
        component: null,
        implemented: false,
      };
    }

    return {
      ...problem,
      ...implemented,
      implemented: true,
    };
  });
}
