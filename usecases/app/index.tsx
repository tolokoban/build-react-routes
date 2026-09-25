/**
 * build-react-routes
 *
 * WARNING! this file has been generated automatically.
 * Please do not edit it because it will probably be overwritten.
 *
 * If you find a bug or if you need an improvement, please fill an issue:
 * https://github.com/tolokoban/build-react-routes/issues
 */

import React from "react"

import { matchRoute, useRouteContext, ROUTES } from "./routes"
import { RouteMatch, RoutePath } from "./types"

export * from "./routes"
export * from "./types"


import Loading0 from "./loading"
import Loading3 from "./organization/loading"
import Loading3_1 from "./organization/loading.fr"
import NotFound0 from "./404"
import NotFound5 from "./user/404"
const Page0 = React.lazy(() => import("./page"))
const Page1 = React.lazy(() => import("./bill/page"))
const Page2 = React.lazy(() => import("./bill/(group)/test/page.mdx"))
const Page3 = React.lazy(() => import("./organization/page"))
const Page4 = React.lazy(() => import("./organization/[id]/page"))
const Page6 = React.lazy(() => import("./user/[id]/page"))
const Page7 = React.lazy(() => import("./user/[id]/[activation]/page"))
const Page8 = React.lazy(() => import("./user/list/page"))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function App({ lang }: { lang?: string }) {
    const context = useRouteContext()
    const fb0 = <Loading0/>
    const pg0 = Page0
    const pg1 = Page1
    const pg2 = Page2
    const fb3 = intl(<Loading3/>, {"fr": <Loading3_1/>}, lang)
    const pg3 = Page3
    const pg4 = Page4
    const pg6 = Page6
    const pg7 = Page7
    const pg8 = Page8
    return (
        <Route path="/" def={[pg0, , fb0, access0, NotFound0]} context={context}>
            <Route path="/bill" def={[pg1, , fb0, access0, NotFound0]} context={context}>
                <Route path="/bill/test" def={[pg2, , fb0, access0, NotFound0]} context={context}/>
            </Route>
            <Route path="/organization" def={[pg3, , fb3, access0, NotFound0]} context={context}>
                <Route path="/organization/[id]" def={[pg4, , fb3, access0, NotFound0]} context={context}/>
            </Route>
            <Route path="/user" def={[, , fb0, access0, NotFound5]} context={context}>
                <Route path="/user/[id]" def={[pg6, , fb0, access0, NotFound5]} context={context}>
                    <Route path="/user/[id]/[activation]" def={[pg7, , fb0, access0, NotFound5]} context={context}/>
                </Route>
                <Route path="/user/list" def={[pg8, , fb0, access8, NotFound5]} context={context}/>
            </Route>
        </Route>
    )
}

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
    NotFound?: React.FC
    context: RouteMatch | null
}

function Route({
    path,
    fallback,
    children,
    Page,
    Layout,
    Template,
    NotFound,
    context,
}: RouteProps) {
    const match = context && matchRoute(context.path, ROUTES[path as RoutePath])

    if (!match) return null

    if (match.distance === 0) {
        if (!Page) {
            if (NotFound) return Layout ? (
                <Layout params={match.params}><NotFound /></Layout>
            ) : <NotFound />
            return null
        }

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

    if (NotFound && !hasMatchingChild(context.path, children)) {
        return Layout ? (
            <Layout params={match.params}><NotFound /></Layout>
        ) : (
            <NotFound />
        )
    }

    return Layout ? (
        <Layout params={match.params}>{children}</Layout>
    ) : (
        <>{children}</>
    )
}

function hasMatchingChild(path: string, children: React.ReactNode): boolean {
    return React.Children.toArray(children).some(child => {
        if (!React.isValidElement(child)) return false
        const childPath = (child.props as { path?: string }).path
        if (!childPath) return false
        return matchRoute(path, ROUTES[childPath as RoutePath]) !== null
    })
}
