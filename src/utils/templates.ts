export const ROUTES_CODE = `
export function goto(route: RoutePath, ...params: (string | number)[]) {
    window.location.hash = hydrateRoute(route, params)
}

export function makeGoto(route: RoutePath, ...params: (string | number)[]) {
    const path = hydrateRoute(route, params)
    return () => { window.location.hash = path }
}

export function hydrateRoute(route: RoutePath, params: (string | number)[]) {
    const items = ROUTES[route]
    return items
        .map(item => typeof item === "number" ? params[item] : item)
        .join("/")
}

function useHash() {
    const [hash, setHash] = React.useState(
        extractHash(window.location.toString())
    )
    React.useEffect(() => {
        const handler = (event: HashChangeEvent) => {
            const oldHash = extractHash(event.oldURL)
            const newHash = extractHash(event.newURL)
            const absHash = ensureAbsoluteHash(newHash, oldHash)
            if (absHash !== newHash) {
                history.replaceState({}, "", \`#\${absHash}\`)
            }
            setHash(absHash)
        }
        window.addEventListener("hashchange", handler)
        return () => window.removeEventListener("hashchange", handler)
    }, [])
    return hash
}

function extractHash(url: string) {
    const hash = new URL(url).hash
    if (!hash) return "/"

    return hash.startsWith("#") ? hash.substring(1) : hash
}

function ensureAbsoluteHash(newHash: string, oldHash: string) {
    if (newHash.startsWith("/")) return newHash

    let hash = newHash
    while (hash.startsWith("./")) {
        hash = hash.substring("./".length)
    }
    const path = oldHash.split("/").filter(nonEmpty)
    for (const item of newHash.split("/")) {
        if (item === "..") {
            if (path.length > 0) path.pop()
        } else {
            path.push(item)
        }
    }
    return \`/\${path.filter(nonEmpty).join("/")}\`
}

function nonEmpty(s: unknown): s is string {
    return typeof s === "string" && s.trim().length > 0
}

interface HashMatch {
    params: { [name: string]: string }
    full: boolean
    route: string
}

class ActiveValue<T> {
    private readonly listeners = new Set<(value: T) => void>()
    private _value: T

    constructor(value: T) {
        this._value = value
    }

    get value() {
        return this._value
    }
    set value(value: T) {
        if (value === this._value) return

        this._value = value
        this.listeners.forEach(listener => listener(value))
    }

    addListener(listener: (value: T) => void) {
        this.listeners.add(listener)
    }

    removeListener(listener: (value: T) => void) {
        this.listeners.delete(listener)
    }
}

const currentRoute = new ActiveValue({
    params: {},
    full: false,
    route: "/",
})

function toParams(value: HashMatch) {
    return {
        ...value.params,
        $route: value.route,
    }
}

export function useRouteParams(): Record<string, string> {
    const [params, setParams] = React.useState(toParams(currentRoute.value))
    React.useEffect(() => {
        const update = (value: HashMatch) => {
            setParams(toParams(value))
        }
        currentRoute.addListener(update)
        return () => currentRoute.removeListener(update)
    }, [])
    return params
}

function match(hash: string, path: string): null | HashMatch {
    const params: Record<string, string> = {}
    const hashItems = hash.split("/").filter(nonEmpty)
    const pathItems = path.split("/").filter(nonEmpty)
    for (let i = 0; i < Math.min(hashItems.length, pathItems.length); i++) {
        const hashItem = hashItems[i]
        const pathItem = pathItems[i]
        if (pathItem.startsWith("[")) {
            const paramName = pathItem.substring(1, pathItem.length - 1)
            params[paramName] = hashItem
        } else if (hashItem !== pathItem) return null
    }

    const full = hashItems.length === pathItems.length
    return { full, params, route: path }
}

function intl<T extends PageComponent | ContainerComponent | JSX.Element>(
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
    element?: JSX.Element
    fallback?: JSX.Element
    children?: React.ReactNode
    Page?: PageComponent
    Layout?: ContainerComponent
    Template?: ContainerComponent
}

function Route({
    path,
    fallback,
    children,
    Page,
    Layout,
    Template,
}: RouteProps) {
    const hash = useHash()
    const m = match(hash, path)
    if (!m) return null

    if (m.full) {
        currentRoute.value = { ...m }
        if (!Page) return null

        const element = Template ? (
            <Template params={m.params}>
                <Page params={m.params} />
            </Template>
        ) : (
            <Page params={m.params} />
        )
        if (Layout) {
            return (
                <Layout params={m.params}>
                    <React.Suspense fallback={fallback}>
                        {element}
                    </React.Suspense>
                </Layout>
            )
        }
        return <React.Suspense fallback={fallback}>{element}</React.Suspense>
    }
    return Layout ? (
        <Layout params={m.params}>{children}</Layout>
    ) : (
        <>{children}</>
    )
}
`
