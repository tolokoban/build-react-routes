export interface Route {
    id: number
    /**
     * The URL path.
     * For example, `app/sections/(green)/light` will
     * give this name: `sections/light`
     */
    name: string
    /**
     * Absolute path.
     */
    path: string
    page?: "tsx" | "mdx"
    layout: boolean
    loading: boolean
    template: boolean
    children: Route[]
    parent?: Route
}
