import { existsSync } from "node:fs";
import Path from "node:path";
import { listDirs, listFiles } from "./fs";
import { Route } from "./types";
import { writeIndexFile } from "./file/index";
import { writeTypesFile } from "./file/types";
import { writeRoutesFile } from "./file/routes";

export function flattenRoutes(route: Route): Route[] {
  const routes: Route[] = [];
  const fringe: Route[] = [route];
  while (fringe.length > 0) {
    const next = fringe.shift();
    if (!next) continue;

    routes.push(next);
    fringe.push(...next.children);
  }
  return routes.filter(hasAnyChildWithPage).sort((r1, r2) => {
    const n1 = r1.name;
    const n2 = r2.name;
    if (n1 < n2) return -1;
    if (n1 > n2) return +1;
    return 0;
  });
}

let routeId = 0;

export async function browseRoutes(path: string, parent?: Route): Promise<Route> {
  if (!parent) routeId = 0;
  const basename = Path.basename(path);
  const route: Route = {
    id: routeId++,
    path,
    name: parent ? Path.join(parent.name, basename) : "/",
    layout: exists(path, "layout.tsx"),
    loading: exists(path, "loading.tsx"),
    template: exists(path, "template.tsx"),
    notFound: exists(path, "404.tsx"),
    access: exists(path, "access.tsx"),
    languages: await findLanguages(path),
    children: [],
    parent,
  };
  if (exists(path, "page.tsx")) route.page = "tsx";
  else if (exists(path, "page.mdx")) route.page = "mdx";
  const subFolders = await findRoutesPathes(path);
  for (const folder of subFolders) {
    const child = await browseRoutes(folder, route);
    route.children.push(child);
  }
  return route;
}

async function findRoutesPathes(path: string): Promise<string[]> {
  const routesPathes: string[] = [];
  const fringe = await listDirs(path);
  while (fringe.length > 0) {
    const dir = fringe.shift();
    if (!dir) continue;

    const basename = Path.basename(dir);
    if (basename.startsWith("(")) {
      const subFolders = await listDirs(Path.resolve(path, dir));
      for (const folder of subFolders) {
        fringe.push(Path.join(dir, folder));
      }
    } else {
      routesPathes.push(dir);
    }
  }
  return routesPathes.map((base) => Path.resolve(path, base));
}

function exists(path: string, filename: string): boolean {
  return existsSync(Path.resolve(path, filename));
}

export async function generateRoutes(rootPath: string, routes: Route[]) {
  await writeIndexFile(rootPath, routes);
  await writeTypesFile(rootPath, routes);
  await writeRoutesFile(rootPath, routes);
}

/**
 * A route must have a page, or any child with a page.
 */
function hasAnyChildWithPage(route: Route): boolean {
  if (route.page) return true;

  for (const child of route.children) {
    if (hasAnyChildWithPage(child)) return true;
  }
  return false;
}

async function findLanguages(path: string): Promise<{
  page: string[];
  layout: string[];
  loading: string[];
  template: string[];
}> {
  const pageExtension = exists(path, "page.tsx") ? "tsx" : "mdx";
  const languages: {
    page: string[];
    layout: string[];
    loading: string[];
    template: string[];
  } = { page: ["_"], layout: ["_"], loading: ["_"], template: ["_"] };
  const files = await listFiles(path);
  for (const file of files) {
    if (checkLang(languages.page, file, "page", pageExtension)) continue;
    if (checkLang(languages.layout, file, "layout")) continue;
    if (checkLang(languages.loading, file, "loading")) continue;
    if (checkLang(languages.template, file, "template")) continue;
  }
  return languages;
}

function checkLang(languages: string[], filename: string, prefix: string, suffix: string = "tsx") {
  const lang = extractLang(filename, prefix, suffix);
  if (lang) {
    languages.push(lang);
    return true;
  }
  return false;
}

function extractLang(filename: string, prefix: string, suffix: string): string | null {
  const start = `${prefix}.`;
  const end = `.${suffix}`;
  if (!filename.startsWith(start) || !filename.endsWith(end)) return null;

  if (filename.length < start.length + end.length) return null;

  return filename.substring(start.length, filename.length - end.length);
}
