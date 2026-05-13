import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./ProblemInfoPanel.css";

/** Strips HTML tags to plain text for copy/accessibility purposes */
function htmlToPlainText(html) {
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/\s{2,}/g, " ")
        .trim();
}

/**
 * Sanitizes LeetCode HTML to only allow safe tags before rendering.
 * Removes script/style/iframe/on* attributes.
 */
function sanitizeHtml(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<iframe[\s\S]*?>/gi, "")
        .replace(/\son\w+="[^"]*"/gi, "")
        .replace(/\son\w+='[^']*'/gi, "")
        .replace(/javascript:/gi, "");
}

export default function ProblemInfoPanel({ slug, descriptions }) {
    const [open, setOpen] = useState(false);

    const info = descriptions?.[slug];
    const hasContent = info?.content;

    return (
        <>
            {/* Toggle bar */}
            <div className="problem-info-bar">
                <button
                    className={`problem-info-toggle${open ? " open" : ""}`}
                    onClick={() => setOpen((v) => !v)}
                    title={open ? "Hide problem description" : "Show problem description"}
                >
                    {/* book icon */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    Problem
                    {/* chevron */}
                    <svg className="chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
            </div>

            {/* Expandable panel */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        className="problem-info-panel"
                        key="info-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                        <div className="problem-info-inner">
                            {!descriptions ? (
                                <p className="problem-info-loading">Loading problem descriptions…</p>
                            ) : !hasContent ? (
                                <p className="problem-info-loading">Description not available for this problem.</p>
                            ) : (
                                <div
                                    // eslint-disable-next-line react/no-danger
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(info.content) }}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/** Returns the plain-text version of a problem's description for use in prompts */
export function getProblemDescriptionText(slug, descriptions) {
    const info = descriptions?.[slug];
    if (!info?.content) return null;
    return htmlToPlainText(info.content);
}
