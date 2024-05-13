import { existsSync } from "node:fs"
import Path from "node:path"
import { listDirs, listFiles, saveText } from "./fs"
import { Route } from "./types"
import { CodeSection, codeLinesToString } from "./code"
import {
    CODE_FOR_INDEX_HEAD,
    CODE_FOR_INDEX_TAIL,
    CODE_FOR_ROUTES_HEAD,
    CODE_FOR_ROUTES_TAIL,
    CODE_FOR_TYPES,
} from "./templates"

const DISCLAIMER = [
    "/**",
    " * build-react-routes",
    " *",
    " * WARNING! this file has been generated automatically.",
    " * Please do not edit it because it will probably be overwritten.",
    " *",
    " * If you find a bug or if you need an improvement, please fill an issue:",
    " * https://github.com/tolokoban/build-react-routes/issues",
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
    return routes.filter(hasAnyChildWithPage).sort((r1, r2) => {
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
        access: exists(path, "access.ts"),
        languages: await findLanguages(path),
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
    await writeIndexFile(rootPath, routes)
    await writeTypesFile(rootPath, routes)
    await writeRoutesFile(rootPath, routes)
}

async function writeRoutesFile(rootPath: string, routes: Route[]) {
    await saveText(
        Path.resolve(rootPath, "routes.ts"),
        codeLinesToString([
            ...DISCLAIMER,
            CODE_FOR_ROUTES_HEAD,
            ...getCodeToImportAccess(routes, rootPath),
            ...generateRoutePathDictionary(routes),
            CODE_FOR_ROUTES_TAIL,
            `const currentRouteContext = new RouteContext([`,
            createAccessArguments(routes),
            `])`,
        ])
    )
}

async function writeTypesFile(rootPath: string, routes: Route[]) {
    await saveText(
        Path.resolve(rootPath, "types.ts"),
        codeLinesToString([
            ...DISCLAIMER,
            "export type RoutePath =",
            routes.map(({ name }) => `| ${JSON.stringify(name)}`),
            CODE_FOR_TYPES,
        ])
    )
}

/**
 * `index.tsx` file owns the root component for the application.
 */
async function writeIndexFile(rootPath: string, routes: Route[]) {
    const [firstRoute] = routes
    const routesWithPages = routes.filter(({ page }) => Boolean(page))
    await saveText(
        Path.resolve(rootPath, "index.tsx"),
        codeLinesToString([
            ...DISCLAIMER,
            CODE_FOR_INDEX_HEAD,
            ...getCodeToImportContainer(routes, "layout", rootPath),
            ...getCodeToImportContainer(routes, "loading", rootPath),
            ...getCodeToImportContainer(routes, "template", rootPath),
            ...routesWithPages.map(route =>
                route.languages.page
                    .map(
                        (lang, index) =>
                            `const Page${route.id}${
                                index > 0 ? `_${index}` : ""
                            } = React.lazy(() => import("./${Path.join(
                                Path.relative(rootPath, route.path),
                                pageName(route, lang)
                            )}"))`
                    )
                    .join("\n")
            ),
            "",
            "// eslint-disable-next-line @typescript-eslint/no-unused-vars",
            "export default function App({ lang }: { lang?: string }) {",
            [
                `const context = useRouteContext()`,
                ...createMultiLangElements(routes),
                "return (",
                createRoutesTree(firstRoute),
                ")",
            ],
            "}",
            CODE_FOR_INDEX_TAIL,
        ])
    )
}

function getCodeToImportContainer(
    routes: Route[],
    key: keyof Route["languages"],
    rootPath: string
): string[] {
    const prop = `${key.charAt(0).toUpperCase()}${key.substring(1)}`
    return routes
        .filter(route => Boolean(route[key]))
        .map(route =>
            route.languages[key]
                .map((lang, index) => {
                    const path = Path.join(
                        Path.relative(rootPath, route.path),
                        key
                    )
                    const name = `${prop}${route.id}`
                    if (index === 0) return `import ${name} from "./${path}"`
                    return `import ${name}_${index} from "./${path}.${lang}"`
                })
                .join("\n")
        )
}

function getCodeToImportAccess(routes: Route[], rootPath: string): string[] {
    const prop = "access"
    return routes
        .filter(route => route.access)
        .map(route => {
            const path = Path.join(
                Path.relative(rootPath, route.path),
                "access"
            )
            const name = `${prop}${route.id}`
            return `import ${name} from "./${path}"`
        })
}

function pageName(route: Route, lang: string): string {
    const extension = route.page
    if (!extension || extension === "tsx") return "page"

    return `page${lang === "_" ? "" : `.${lang}`}.${extension}`
}

function makeProp(
    route: Route,
    key: keyof Route["languages"],
    varName: string
): string {
    if (!route[key]) return ""

    const prefix = `${key.charAt(0).toUpperCase()}${key.substring(1)}`
    return ` ${prefix}={${varName}${route.id}}`
}

function makeIntl(
    id: number,
    languages: string[],
    name: string,
    isElement = false
) {
    const wrap = isElement ? (t: string) => `<${t}/>` : (t: string) => t
    const base = `${name}${id}`
    if (languages.length < 2) return wrap(base)

    return `intl(${wrap(`${base}`)}, {${languages
        .map((lang, index) =>
            index === 0 ? null : `"${lang}": ${wrap(`${base}_${index}`)}`
        )
        .filter(item => item !== null)
        .join(", ")}}, lang)`
}

function createMultiLangElements(routes: Route[]): CodeSection[] {
    const code: CodeSection[] = []
    let hasRootLoading = false
    routes.forEach(route => {
        if (route.loading) {
            if (route.id === 0) hasRootLoading = true
            code.push(
                `const fb${route.id} = ${makeIntl(
                    route.id,
                    route.languages.loading,
                    "Loading",
                    true
                )}`
            )
        }
        if (route.layout) {
            code.push(
                `const ly${route.id} = ${makeIntl(
                    route.id,
                    route.languages.layout,
                    "Layout"
                )}`
            )
        }
        if (route.template) {
            code.push(
                `const tp${route.id} = ${makeIntl(
                    route.id,
                    route.languages.template,
                    "Template"
                )}`
            )
        }
        if (route.page) {
            code.push(
                `const pg${route.id} = ${makeIntl(
                    route.id,
                    route.languages.page,
                    "Page"
                )}`
            )
        }
    })
    if (!hasRootLoading) code.unshift("const fb = <div>Loading...</div>")
    return code
}

function createRoutesTree(route: Route): CodeSection {
    const loading = getLoading(route)
    const template = getTemplate(route)
    let routeCode = `Route path="${route.name}"${makeProp(
        route,
        "page",
        "pg"
    )}${makeProp(route, "layout", "ly")}${
        template ? ` Template={${template}}` : ""
    } ${loading}`
    return route.children.length > 0
        ? [
              `<${routeCode} context={context}>`,
              ...route.children.map(createRoutesTree),
              `</Route>`,
          ]
        : [`<${routeCode} context={context}/>`]
}

function getLoading(route: Route) {
    let current: Route | undefined = route
    while (current) {
        if (current.loading) {
            return `fallback={fb${current.id}}`
        }
        current = current.parent
    }
    return `fallback={fb}`
}

function getTemplate(route: Route) {
    let template: string | null = null
    let current: Route | undefined = route
    while (current) {
        if (current.template) {
            template = `tp${current.id}`
            break
        }
        current = current.parent
    }
    return template
}

/**
 * A route must have a page, or any child with a page.
 */
function hasAnyChildWithPage(route: Route): boolean {
    if (route.page) return true

    for (const child of route.children) {
        if (hasAnyChildWithPage(child)) return true
    }
    return false
}

async function findLanguages(path: string): Promise<{
    page: string[]
    layout: string[]
    loading: string[]
    template: string[]
}> {
    const pageExtension = exists(path, "page.tsx") ? "tsx" : "mdx"
    const languages: {
        page: string[]
        layout: string[]
        loading: string[]
        template: string[]
    } = { page: ["_"], layout: ["_"], loading: ["_"], template: ["_"] }
    const files = await listFiles(path)
    for (const file of files) {
        if (checkLang(languages.page, file, "page", pageExtension)) continue
        if (checkLang(languages.layout, file, "layout")) continue
        if (checkLang(languages.loading, file, "loading")) continue
        if (checkLang(languages.template, file, "template")) continue
    }
    return languages
}

function checkLang(
    languages: string[],
    filename: string,
    prefix: string,
    suffix: string = "tsx"
) {
    const lang = extractLang(filename, prefix, suffix)
    if (lang) {
        languages.push(lang)
        return true
    }
    return false
}

function extractLang(
    filename: string,
    prefix: string,
    suffix: string
): string | null {
    const start = `${prefix}.`
    const end = `.${suffix}`
    if (!filename.startsWith(start) || !filename.endsWith(end)) return null

    if (filename.length < start.length + end.length) return null

    return filename.substring(start.length, filename.length - end.length)
}

function parseRouteName(name: string): string[] {
    const items = name.split("/")
    const parts: string[] = []
    let buffer: string[] = []
    for (const item of items) {
        if (item.includes("[")) {
            parts.push(buffer.join("/"), item)
            buffer = []
        } else {
            buffer.push(item)
        }
    }
    if (buffer.length > 0) parts.push(buffer.join("/"))
    return parts
}

function generateRoutePathDictionary(routes: Route[]) {
    if (routes.length < 1) return []

    const splittedPaths: string[][] = routes.map(({ name }) =>
        parseRouteName(name)
    )
    return [
        "",
        "export const ROUTES: Record<RoutePath, string[]> = {",
        splittedPaths.map(
            (sp, index) =>
                `${JSON.stringify(routes[index].name)}: ${JSON.stringify(sp)},`
        ),
        "}",
    ]
}

function createAccessArguments(routes: Route[]) {
    const args: Array<[route: string, access: string]> = routes
        .filter(route => route.access)
        .map(route => [route.name, `access${route.id}`])
    return args.map(
        ([route, access]) => `[${JSON.stringify(route)}, ${access}]`
    )
}
