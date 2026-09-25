import Path from "node:path";
import FS from "node:fs";

import { color } from "./log";

export function createDefault404(root: string) {
  const notFoundPath = Path.resolve(root, "404.tsx");
  if (!FS.existsSync(notFoundPath)) {
    FS.writeFileSync(
      notFoundPath,
      `export default function Page404() {
    return (
        <div
            style={{
                color: "#fff",
                background: "#000",
                position: "fixed",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
            }}>
            <div
                style={{
                    fontFamily: "sans-serif",
                    fontSize: "10vw",
                }}>
                404
            </div>
        </div>
    )
}
`,
    );
    console.log("A default", color("404.tsx", "Yellow"), "file has been created.");
  }
}

export function createDefaultLoading(root: string) {
  const notFoundPath = Path.resolve(root, "loading.tsx");
  const notFoundCssPath = Path.resolve(root, "loading.css");
  if (!FS.existsSync(notFoundPath)) {
    const id = `Loading_${Date.now().toString(27)}`;
    FS.writeFileSync(
      notFoundCssPath,
      `@keyframes anim_${id} {
  0% { transform: scale(1); }
  50% { transform: scale(2); }
  100% { transform: scale(1); }
}

div.${id} {
  color: #fff;
  background: #000;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-family: sans-serif;
  font-size: 10vw;
}

div.${id} span {
  display: inline-block;
  animation: anim_${id} 1s infinite;
  animation-delay: calc(var(--custom-n) * 1s / 3);
}
`,
    );
    FS.writeFileSync(
      notFoundPath,
      `import React from "react"
import "./loading.css"

export default function PageLoading() {
    return (
        <div className="${id}">
            <div>
                ${[0, 1, 2]
                  .map(
                    (n) =>
                      `<span key="${n}" style={{ "--custom-n": ${n} } as React.CSSProperties}>•</span>`,
                  )
                  .join("\n                ")}
            </div>
        </div>
    )
}
`,
    );
    console.log("A default", color("loading.tsx", "Yellow"), "file has been created.");
  }
}
