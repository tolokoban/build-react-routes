import FS from "node:fs"
import Path from "node:path"

export function parseProgramArguments(): {
    targets: string[]
    watchMode: boolean
} {
    const [node, program, ...args] = process.argv
    try {
        const targets: string[] = []
        let watchMode = false
        for (const arg of args) {
            if (arg.startsWith("-")) {
                // this is an option.
                if (arg === "-w" || arg === "--watch") {
                    watchMode = true
                } else {
                    throw Error(`Unknown option: ${arg}`)
                }
            } else {
                const path = Path.resolve(arg)
                if (!FS.existsSync(path)) {
                    throw Error(`Path not found: "${path}"`)
                }
                const stat = FS.statSync(path)
                if (!stat.isDirectory()) {
                    throw Error(`This is not a directory: "${path}"`)
                }

                targets.push(path)
            }
        }
        if (targets.length < 1) {
            throw Error("Missing mandatory argument!")
        }

        return { targets, watchMode }
    } catch (ex) {
        const message = ex instanceof Error ? ex.message : JSON.stringify(ex)
        console.error("")
        console.error("Fatal error!", message)
        console.error("")
        console.error("Usage:")
        console.error(`    ${node} ${program} [-w|--watch] path`)
        console.error("")
        process.exit(1)
    }
}
