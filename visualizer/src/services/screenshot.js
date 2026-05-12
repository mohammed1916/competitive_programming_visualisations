/**
 * Capture a screenshot of the visualizer panel as a base64 PNG data URL.
 * Targets any element with [data-visualizer-root] in the DOM.
 */
export async function captureVisualizer() {
  const target = document.querySelector("[data-visualizer-root]");
  if (!target) throw new Error("No visualizer panel found on the page.");

  // Dynamic import to keep html2canvas out of the critical bundle
  const { default: html2canvas } = await import("html2canvas");

  const canvas = await html2canvas(target, {
    backgroundColor: "#0f172a",
    scale: 1.5,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL("image/png");
}
