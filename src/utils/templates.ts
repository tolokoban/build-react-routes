export const CODE_FOR_ROUTES_HEAD = `
import React from "react"

import { RoutePath, RouteMatch } from "./types"
`

export const CODE_FOR_ROUTES_TAIL = `
/**
 * Using this function prevents dangling routes from being
 * discovered at runtime. If you try to reach a route that
 * does not exist anymore, you will get a compilation error.
 * @param route Canonic name of the target route.
 * @param params If the canonical name has \`[name]\` parts,
 * they will be hydrated by the \`params\`.
 * For instance, \`goto("/article/[id]/detail", 27)\` will lead
 * to \`"/article/27/detail"\`.
 * @returns \`false\` if we already are on this page (with the same params).
 */
export function goto(route: RoutePath, ...params: (string | number)[]) {
    const path = hydrateRoute(route, params)
    if (path === getRouteContext().value?.path) return false

    window.location.hash = path
    return true
}

/**
 * Syntaxic sugar to return \`() => { goto(...) }\`.
 */
export function makeGoto(route: RoutePath, ...params: (string | number)[]) {
    return () => { goto(route, ...params) }
}

export function isRouteEqualTo(route: RoutePath, ...params: (string | number)[]) {
    return getRouteContext().value?.path === hydrateRoute(route, params)
}

export function findRouteForPath(path: string): RouteMatch | null {
    let bestMatch: RouteMatch | null = null
    for (const parts of Object.values(ROUTES)) {
        const match = matchRoute(path, parts)
        if (!match) continue

        if (match.distance === 0) return match

        if (!bestMatch || match.distance < bestMatch.distance) {
            bestMatch = match
        }
    }
    return bestMatch
}

export function matchRoute(path: string, parts: string[] | undefined): RouteMatch | null {
    if (!parts) return null
    
    let current = path
    const params: Record<string, string> = {}
    for (let i = 0; i < parts.length; i++) {
        if (current.length < 1) return null

        const part = parts[i]
        if (part.startsWith("[")) {
            const name = part.substring(1, part.length - 1)
            const [head, tail] = decapitate(current)
            params[name] = head
            current = tail
        } else if (current.startsWith(part)) {
            current = current.substring(part.length + 1)
        } else {
            return null
        }
    }
    const match: RouteMatch = {
        path,
        route: parts.join("/") as RoutePath,
        params,
        distance: current.length,
    }
    return match
}

function decapitate(text: string): [string, string] {
    const pos = text.indexOf("/")
    if (pos < 0) return [text, ""]

    return [text.substring(0, pos), text.substring(pos + 1)]
}

function hydrateRoute(route: RoutePath, params: (string | number)[]) {
    const items = ROUTES[route]
    let i = 0
    return items
        .map(item => (item.charAt(0) === "[" ? params[i++] : item))
        .join("/")
}

class RouteContext {
    private readonly listeners = new Set<(context: RouteMatch | null) => void>()
    private _value: RouteMatch | null = null

    constructor(
        private readonly security: [
            RoutePath,
            (path: RoutePath, hash: string) => Promise<RoutePath | undefined>
        ][]
    ) {
        const hash = this.extractHash(window.location.href)
        this.setHash(hash).then(() =>
            window.addEventListener("hashchange", this.handleHashChange)
        ).catch(ex => {
            console.error(\`Unable to set hash to "\${hash}":\`, ex)
        })
    }

    addListener(listener: (value: RouteMatch | null) => void) {
        this.listeners.add(listener)
    }

    removeListener(listener: (value: RouteMatch | null) => void) {
        this.listeners.delete(listener)
    }

    get value() {
        return this._value
    }

    private async setHash(hash: string) {
        let value = findRouteForPath(hash)
        if (value) {
            for (const [route, access] of this.security) {
                if (!value.route.startsWith(route)) continue

                const authorizedRoute = await access(value.route, hash)
                if (authorizedRoute && authorizedRoute !== value.route) {
                    value = findRouteForPath(authorizedRoute)
                    if (!value) break

                    this._value = null
                    goto(value.path as RoutePath)
                    return
                }
            }
        }
        if (this._value?.route === value?.route) return

        this._value = value
        this.listeners.forEach(listener => listener(value))
    }

    private readonly handleHashChange = (event: HashChangeEvent) => {
        const oldHash = this.extractHash(event.oldURL)
        const newHash = this.extractHash(event.newURL)
        const absHash = this.ensureAbsoluteHash(newHash, oldHash)
        if (absHash !== newHash) {
            globalThis.history.replaceState({}, "", \`#$\{absHash}\`)
        }
        void this.setHash(absHash)
    }

    private extractHash(url: string) {
        const hash = new URL(url).hash
        if (!hash) return "/"

        return hash.startsWith("#") ? hash.substring(1) : hash
    }

    private ensureAbsoluteHash(newHash: string, oldHash: string) {
        if (newHash.startsWith("/")) return newHash

        let hash = newHash
        while (hash.startsWith("./")) {
            hash = hash.substring("./".length)
        }
        const path = oldHash.split("/").filter(this.nonEmpty)
        for (const item of newHash.split("/")) {
            if (item === "..") {
                if (path.length > 0) path.pop()
            } else {
                path.push(item)
            }
        }
        return \`/$\{path.filter(this.nonEmpty).join("/")}\`
    }

    private readonly nonEmpty = (s: unknown): s is string => {
        return typeof s === "string" && s.trim().length > 0
    }
}

export function useRouteContext(): RouteMatch | null {
    const [params, setParams] = React.useState(getRouteContext().value)
    React.useEffect(() => {
        const update = (value: RouteMatch | null) => {
            setParams(value)
        }
        getRouteContext().addListener(update)
        return () => getRouteContext().removeListener(update)
    }, [])
    return params
}

export function useRouteParams<T extends string>(
    ...names: T[]
): Partial<Record<T, string>> {
    const context = useRouteContext()
    const params: Partial<Record<T, string>> = {}
    if (context) {
        for (const name of names) {
            const value = context.params[name]
            if (typeof value === "string") params[name] = value
        }
    }
    return params
}

export function useRouteParamAsString(name: string, defaultValue = ""): string {
    const params = useRouteParams(name)
    return params[name] ?? defaultValue
}

export function useRouteParamAsInt(name: string, defaultValue = 0): number {
    const params = useRouteParams(name)
    const value = parseInt(params[name] ?? "", 10)
    return Number.isNaN(value) ? defaultValue : value
}

export function useRouteParamAsFloat(name: string, defaultValue = 0): number {
    const params = useRouteParams(name)
    const value = parseFloat(params[name] ?? "")
    return Number.isNaN(value) ? defaultValue : value
}

/**
 * Parse param as JSON strings.
 */
export function useRouteParam<T>(
    name: string,
    defaultValue: T,
    typeGuard: (data: unknown) => data is T
): T {
    const params = useRouteParams(name)
    try {
        const text = decodeURIComponent(params[name] ?? "")
        const value: unknown = JSON.parse(text)
        return typeGuard(value) ? value : defaultValue
    } catch (ex) {
        return defaultValue
    }
}
`

export const CODE_FOR_INDEX_HEAD = `
import React from "react"

import { matchRoute, useRouteContext, ROUTES } from "./routes"
import { RouteMatch, RoutePath } from "./types"

export * from "./routes"
export * from "./types"

`

export const CODE_FOR_INDEX_TAIL = `
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function intl<T extends PageComponent | ContainerComponent | React.ReactNode>(
    page: T,
    translations: Record<string, T>,
    lang = ""
): T {
    const candidate1 = translations[lang]
    if (candidate1) return candidate1

    const [prefix] = lang.split("-")
    const candidate2 = translations[prefix]
    if (candidate2) return candidate2

    return page
}

type PageComponent = React.FC<{ params: Record<string, string> }>
type ContainerComponent = React.FC<{
    children: React.ReactNode
    params: Record<string, string>
}>

interface RouteProps {
    path: string
    element?: React.ReactNode
    fallback?: React.ReactNode
    children?: React.ReactNode
    Page?: PageComponent
    Layout?: ContainerComponent
    Template?: ContainerComponent
    context: RouteMatch | null
}

function Route({
    path,
    fallback,
    children,
    Page,
    Layout,
    Template,
    context,
}: RouteProps) {
    const match = context && matchRoute(context.path, ROUTES[path as RoutePath])

    if (!match) return null

    if (match.distance === 0) {
        if (!Page) return null

        const element = Template ? (
            <Template params={match.params}>
                <Page params={match.params} />
            </Template>
        ) : (
            <Page params={match.params} />
        )
        if (Layout) {
            return (
                <Layout params={match.params}>
                    <React.Suspense fallback={fallback}>
                        {element}
                    </React.Suspense>
                </Layout>
            )
        }
        return <React.Suspense fallback={fallback}>{element}</React.Suspense>
    }
    return Layout ? (
        <Layout params={match.params}>{children}</Layout>
    ) : (
        <>{children}</>
    )
}
`

export const CODE_FOR_TYPES = `
export interface RouteMatch {
    path: string
    route: RoutePath
    params: Record<string, string>
    /**
     * 0 means a perfect match.
     */
    distance: number
}
`
