#!/usr/bin/env node

import FS from "node:fs"
import Path from "node:path"
import { exec } from "node:child_process"
import Chokidar from "chokidar"
import { color, logError, logRoute } from "./utils/log"
import { browseRoutes, flattenRoutes, generateRoutes } from "./utils/routes"
import { Route } from "./utils/types"
import { parseProgramArguments } from "./utils/args"
import { version } from "./package.json"

function stringifyRoute(route: Route): string {
    return `{${route.name},${route.page},${route.layout},${route.loading},${route.notFound},${route.path
        }},${FS.existsSync(Path.resolve(route.path, "index.tsx"))}`
}

function stringifyRoutes(routes: Route[]): string {
    return routes.map(stringifyRoute).join("\n")
}

async function start() {
    try {
        const { targets, watchMode, after } = parseProgramArguments()
        const [root] = targets
        const notFoundPath = Path.resolve(root, "404.tsx")
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
`
            )
        }
        console.log(color("Processing folder:", "LightBlue"), root)
        let previousStructure = ""
        const generate = async () => {
            const route = await browseRoutes(root)
            const routes = flattenRoutes(route)
            const structure = stringifyRoutes(routes)
            if (structure !== previousStructure) {
                previousStructure = structure
                console.log()
                routes.forEach(r => logRoute(r))
                console.log()
                await generateRoutes(root, routes)
            }
            if (after) {
                console.log(color("Execute:", "LightCyan"), after)
                exec(after, (err, stdout, stderr) => {
                    if (err) {
                        console.error(
                            "Fatal error in AFTER script:",
                            err.message
                        )
                        return
                    }
                    console.log(stdout)
                    console.error(stderr)
                })
            }
        }
        await generate()
        if (watchMode) {
            console.log("")
            console.log(color("Watching for files changes...", "LightBlue"))
            console.log("")
            let timeout: NodeJS.Timeout | undefined = undefined
            Chokidar.watch(root).on("all", (event, path) => {
                clearTimeout(timeout)
                timeout = setTimeout(generate, 300)
            })
        }
    } catch (ex) {
        logError(ex)
    }
}

console.log(color("build-react-route", "LightPurple"), version)
start()
