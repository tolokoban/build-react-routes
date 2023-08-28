export type CodeSection = string | boolean | CodeSection[]

export function codeToString(code: CodeSection, indent = ""): string {
    if (typeof code === "boolean") return ""
    if (typeof code === "string") return `${indent}${code}`

    const subIndent = `${indent}    `
    return code.map(section => codeToString(section, subIndent)).join("\n")
}

export function codeLinesToString(lines: CodeSection[]) {
    return lines
        .filter(line => typeof line !== "boolean")
        .map(line => codeToString(line))
        .join("\n")
}
