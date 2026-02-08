"use client";

/*
* components/CopyLinkButton.tsx
*Purpose:
* - Copy a sharable plan URL (MongoBacked by ?id=..)
* - Share plan link with people who can then view the plan and track their progress
*/

import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }){
    const [copied, setCopied] = useState(false);

    async function onCopy() {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    return (
        <button
            type="button"
            onClick={onCopy}
            style={{
                padding: "10px 12px",
                borderRadius: 0,
                border: "1px solid #ccc",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {copied ? "Copied!" : "Copy share link"}
            </button>
          );
        }
