import FS from "node:fs/promises"
import { existsSync } from "node:fs"
import Path from "node:path"
import { color, logWarning } from "./log"

/**
 * @param path Relative to the root of the project.
 * Where we can find bith "lib/" and "doc/" forlders.
 */
export function absPath(...path: string[]) {
    return Path.resolve(__dirname, "../../../..", ...path)
}

/**
 * Recursively create a directory if not exist.
 * @returns The first directory path created
 */
export async function mkdir(path: string): Promise<string | undefined> {
    return await FS.mkdir(path, {
        recursive: true,
        mode: 0o700,
    })
}

/**
 * Save a file if it does not exist yet.
 * @returns `false` if the file was not saved because it already exists.
 */
export async function saveTextIfNew(
    path: string,
    content: string
): Promise<boolean> {
    if (existsSync(path)) return false

    await saveText(path, content)
    return true
}

/**
 * Save a file.
 */
export async function saveText(path: string, content: string): Promise<void> {
    console.log(color("Write:", "LightGreen"), path)
    return await FS.writeFile(path, content, { encoding: "utf-8" })
}

export async function listDirs(path: string): Promise<string[]> {
    const files = await FS.readdir(path, { withFileTypes: true })
    return files
        .filter(f => f.isDirectory())
        .map(f => f.name)
        .filter(name => !"._".includes(name.charAt(0)))
        .sort()
}

export async function loadText(path: string): Promise<string> {
    if (!existsSync(path)) {
        logWarning("This file does not exist:", path)
        return ""
    }

    const content = await FS.readFile(path)
    return content.toString()
}
