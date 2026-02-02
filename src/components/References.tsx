"use client";

import { useState } from "react";
import type { Reference } from "#/lib/rag/types";

interface ReferencesProps {
  references: Reference[];
}

export default function References({ references }: ReferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (references.length === 0) {
    return null;
  }

  const sourceLabel = references.length === 1 ? "1 source" : `${references.length} sources`;

  const formatLocation = (ref: Reference): string => {
    if (ref.pageNumber !== undefined) {
      return `Page ${ref.pageNumber}`;
    }
    if (ref.lineStart !== undefined && ref.lineEnd !== undefined) {
      return `Lines ${ref.lineStart}-${ref.lineEnd}`;
    }
    return "";
  };

  return (
    <div className="mt-3 border-t border-gray-700 pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1"
        aria-expanded={isExpanded}
      >
        <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
        {sourceLabel}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {references.map((ref, index) => {
            const location = formatLocation(ref);
            const isReferenceExpanded = expandedIndex === index;

            return (
              <div key={index} className="text-sm">
                <button
                  onClick={() => setExpandedIndex(isReferenceExpanded ? null : index)}
                  className="text-gray-300 hover:text-white flex items-center gap-2"
                  aria-expanded={isReferenceExpanded}
                >
                  <span className="text-xs">{isReferenceExpanded ? "▼" : "▶"}</span>
                  <span>{ref.documentName}</span>
                  {location && <span className="text-gray-500">({location})</span>}
                </button>

                {isReferenceExpanded && (
                  <div className="mt-1 ml-4 p-2 bg-gray-800 rounded text-gray-300 text-xs">
                    {ref.snippet}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
