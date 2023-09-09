export const ROUTES_CODE = `
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
                history.replaceState({}, "", \`#$\{absHash}\`)
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
    return \`/$\{path.filter(nonEmpty).join("/")}\`
}

function nonEmpty(s: unknown): s is string {
    return typeof s === "string" && s.trim().length > 0
}

interface HashMatch {
    params: { [name: string]: string }
    full: boolean
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

    return {
        full: hashItems.length === pathItems.length,
        params,
    }
}

interface RouteProps {
    path: string
    element?: JSX.Element
    fallback?: JSX.Element
    children?: React.ReactNode
    Page?: React.FC<{ params: Record<string, string> }>
    Layout?: React.FC<{
        children: React.ReactNode
        params: Record<string, string>
    }>
    Template?: React.FC<{
        children: React.ReactNode
        params: Record<string, string>
    }>
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
