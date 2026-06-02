/* Metadata-only implementedProblems. No eager visualizer imports here.
   Each entry includes `folder` which the app will use to lazily load
   the visualizer from `src/problems/<folder>/index.jsx` via React.lazy. */

export const TRACKS = {
  LEETCODE: "leetcode",
  BASICS: "basics",
  CODEFORCES: "codeforces",
};

// Build IMPLEMENTED_PROBLEMS from problem modules automatically.
// Each problem module may export `meta` (preferred). If absent, infer values from folder name.
const problemModules = import.meta.glob("../problems/**/index.jsx", {
  eager: true,
});

function slugFromPath(path) {
  const parts = path.split("/").filter(Boolean);
  const folder = parts[parts.length - 2];
  return (
    folder && folder.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
  ).toLowerCase();
}

function inferFromModule(path, mod) {
  const folder = path.split("/").filter(Boolean).slice(-2, -1)[0];
  const meta = mod?.meta || {};
  const slug = meta.slug || slugFromPath(path);
  const title =
    meta.title || (folder && folder.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
  return {
    id: meta.id || `auto-${slug}`,
    number: meta.number || "",
    title,
    slug,
    description: meta.description || "Auto-generated visualizer entry.",
    difficulty: meta.difficulty || "Medium",
    tags: meta.tags || [],
    accent: meta.accent || "#64748b",
    folder: folder,
    implemented: true,
  };
}

const IMPLEMENTED_PROBLEMS = Object.keys(problemModules).map((path) => {
  const mod = problemModules[path];
  return inferFromModule(path, mod);
});

export { IMPLEMENTED_PROBLEMS };

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
