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
                console.log(">>>", absHash)
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
    const path = oldHash.substring(1).split("/")
    for (const item of newHash.split("/")) {
        if (item === "..") {
            if (path.length > 0) path.pop()
        } else {
            path.push(item)
        }
    }
    return \`/$\{path.join("/")}\`
}

interface HashMatch {
    params: { [name: string]: string }
    full: boolean
}

function match(hash: string, path: string): null | HashMatch {
    if (!hash.startsWith(path)) return null

    return {
        full: hash.length === path.length,
        params: {},
    }
}

interface RouteProps {
    path: string
    element?: JSX.Element
    fallback?: JSX.Element
    children?: React.ReactNode
    Page?: React.FC<{}>
    Layout?: React.FC<{ children: React.ReactNode }>
    Template?: React.FC<{ children: React.ReactNode }>
}

function Route({ path, fallback, children, Page, Layout, Template }: RouteProps) {
    const hash = useHash()
    const m = match(hash, path)
    if (!m) return null

    if (m.full) {
        if (!Page) return null
        
        const element = Template ? <Template><Page /></Template> : <Page />
        if (Layout) {
            return (
                <Layout>
                    <React.Suspense fallback={fallback}>
                        {element}
                    </React.Suspense>
                </Layout>
            )
        }
        return <React.Suspense fallback={fallback}>{element}</React.Suspense>
    }
    return Layout ? <Layout>{children}</Layout> : <>{children}</>
}
`
