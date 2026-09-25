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
     * For example: `app/sections/(green)/light`
     */
    path: string
    page?: "tsx" | "mdx"
    layout: boolean
    loading: boolean
    template: boolean
    notFound: boolean
    /**
     * Is there an access module?
     * If yes, it must be something like this:
     * ```tsx
     * export default function Access({children}: {children:React.ReactNode})
     * ```
     */
    access: boolean
    languages: {
        page: string[]
        layout: string[]
        loading: string[]
        template: string[]
    }
    children: Route[]
    parent?: Route
}
