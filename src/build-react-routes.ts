#!/usr/bin/env node

import FS from "node:fs"
import Path from "node:path"
import Chokidar from "chokidar"
import { color, logError, logRoute } from "./utils/log"
import { browseRoutes, flattenRoutes, generateRoutes } from "./utils/routes"
import { Route } from "./utils/types"
import { parseProgramArguments } from "./utils/args"
import { version } from "./package.json"

function stringifyRoute(route: Route): string {
    return `{${route.name},${route.page},${route.layout},${route.loading},${
        route.path
    }},${FS.existsSync(Path.resolve(route.path, "index.tsx"))}`
}

function stringifyRoutes(routes: Route[]): string {
    return routes.map(stringifyRoute).join("\n")
}

async function start() {
    try {
        const { targets, watchMode } = parseProgramArguments()
        const [root] = targets
        console.log(color("Processing folder:", "LightBlue"), root)
        let previousStructure = ""
        const generate = async () => {
            const route = await browseRoutes(root)
            const routes = flattenRoutes(route)
            const structure = stringifyRoutes(routes)
            if (structure === previousStructure) return

            previousStructure = structure
            console.log()
            routes.forEach(r => logRoute(r))
            console.log()
            await generateRoutes(root, routes)
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
