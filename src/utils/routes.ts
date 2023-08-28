import { existsSync } from "node:fs"
import Path from "node:path"
import { listDirs, saveText, saveTextIfNew } from "./fs"
import { Route } from "./types"
import { CodeSection, codeToString } from "./code"
import { ROUTES_CODE } from "./templates"

const DISCLAIMER = [
    "/**",
    " * WARNING! this file has been generated automatically.",
    " * Please do not edit it because it will probably be overwritten.",
    ` * ${new Date().toISOString()}`,
    " */",
]

export function flattenRoutes(route: Route): Route[] {
    const routes: Route[] = []
    const fringe: Route[] = [route]
    while (fringe.length > 0) {
        const next = fringe.shift()
        if (!next) continue

        routes.push(next)
        fringe.push(...next.children)
    }
    return routes
        .filter(({ page }) => Boolean(page))
        .sort((r1, r2) => {
            const n1 = r1.name
            const n2 = r2.name
            if (n1 < n2) return -1
            if (n1 > n2) return +1
            return 0
        })
}

let routeId = 0

export async function browseRoutes(
    path: string,
    parent?: Route
): Promise<Route> {
    if (!parent) routeId = 0
    const basename = Path.basename(path)
    const route: Route = {
        id: routeId++,
        path,
        name: parent ? Path.join(parent.name, basename) : "/",
        layout: exists(path, "layout.tsx"),
        loading: exists(path, "loading.tsx"),
        template: exists(path, "template.tsx"),
        children: [],
        parent,
    }
    if (exists(path, "page.tsx")) route.page = "tsx"
    else if (exists(path, "page.mdx")) route.page = "mdx"
    const subFolders = await findRoutesPathes(path)
    for (const folder of subFolders) {
        const child = await browseRoutes(folder, route)
        route.children.push(child)
    }
    return route
}

async function findRoutesPathes(path: string): Promise<string[]> {
    const routesPathes: string[] = []
    const fringe = await listDirs(path)
    while (fringe.length > 0) {
        const dir = fringe.shift()
        if (!dir) continue

        const basename = Path.basename(dir)
        if (basename.startsWith("(")) {
            const subFolders = await listDirs(Path.resolve(path, dir))
            for (const folder of subFolders) {
                fringe.push(Path.join(dir, folder))
            }
        } else {
            routesPathes.push(dir)
        }
    }
    return routesPathes.map(base => Path.resolve(path, base))
}

function exists(path: string, filename: string): boolean {
    return existsSync(Path.resolve(path, filename))
}

export async function generateRoutes(rootPath: string, routes: Route[]) {
    const [firstRoute] = routes
    await saveText(
        Path.resolve(rootPath, "index.tsx"),
        codeToString([
            ...DISCLAIMER,
            'import React from "react"',
            ...routes
                .filter(({ layout }) => Boolean(layout))
                .map(
                    ({ id, path }) =>
                        `import Layout${id} from "./${Path.join(
                            Path.relative(rootPath, path),
                            "layout"
                        )}"`
                ),
            ...routes
                .filter(({ loading }) => Boolean(loading))
                .map(
                    ({ id, path }) =>
                        `import Loading${id} from "./${Path.join(
                            Path.relative(rootPath, path),
                            "loading"
                        )}"`
                ),
            ...routes
                .filter(({ template }) => Boolean(template))
                .map(
                    ({ id, path }) =>
                        `import Template${id} from "./${Path.join(
                            Path.relative(rootPath, path),
                            "template"
                        )}"`
                ),
            "",
            ...routes.map(
                route =>
                    `const Page${
                        route.id
                    } = React.lazy(() => import("./${Path.join(
                        Path.relative(rootPath, route.path),
                        pageName(route)
                    )}"))`
            ),
            "",
            "export default function App() {",
            ["return (", createRoutesTree(firstRoute), ")"],
            "}",
            ROUTES_CODE,
        ])
    )
}

function pageName(route: Route): string {
    const extension = route.page
    if (!extension || extension === "tsx") return "page"

    return `page.${extension}`
}

function createRoutesTree(route: Route): CodeSection {
    const loading = getLoading(route)
    const template = getTemplate(route)
    const routeCode = `Route path="${route.name}" ${
        route.page ? `Page={Page${route.id}}` : ""
    }${route.layout ? ` Layout={Layout${route.id}}` : ""}${
        template ? ` Template={${template}}` : ""
    } fallback={${loading}}`
    return route.children.length > 0
        ? [
              `<${routeCode}>`,
              ...route.children.map(createRoutesTree),
              `</Route>`,
          ]
        : [`<${routeCode} />`]
}

function getLoading(route: Route) {
    let loading = `<div>Loading...</div>`
    let current: Route | undefined = route
    while (current) {
        if (current.loading) {
            loading = `<Loading${current.id} />`
            break
        }
        current = current.parent
    }
    return loading
}

function getTemplate(route: Route) {
    let template: string | null = null
    let current: Route | undefined = route
    while (current) {
        if (current.template) {
            template = `Template${current.id}`
            break
        }
        current = current.parent
    }
    return template
}
