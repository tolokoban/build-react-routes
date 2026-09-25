import Path from "node:path";
import { saveText } from "../fs";
import { Route } from "../types";
import { codeLinesToString } from "../code";
import { CODE_FOR_ROUTES_HEAD, CODE_FOR_ROUTES_TAIL } from "../templates";
import { DISCLAIMER } from "./disclaimer";

export async function writeRoutesFile(rootPath: string, routes: Route[]) {
  await saveText(
    Path.resolve(rootPath, "routes.ts"),
    codeLinesToString([
      ...DISCLAIMER,
      CODE_FOR_ROUTES_HEAD,
      ...generateRoutePathDictionary(routes),
      CODE_FOR_ROUTES_TAIL,
      "let currentRouteContext: null | RouteContext = null",
      "",
      "function getRouteContext() {",
      [
        "if (!currentRouteContext) currentRouteContext = new RouteContext()",
        "return currentRouteContext",
      ],
      "}",
    ]),
  );
}

function parseRouteName(name: string): string[] {
  const items = name.split("/");
  const parts: string[] = [];
  let buffer: string[] = [];
  for (const item of items) {
    if (item.includes("[")) {
      parts.push(buffer.join("/"), item);
      buffer = [];
    } else {
      buffer.push(item);
    }
  }
  if (buffer.length > 0) parts.push(buffer.join("/"));
  return parts;
}

function generateRoutePathDictionary(routes: Route[]) {
  if (routes.length < 1) return [];

  const splittedPaths: string[][] = routes.map(({ name }) => parseRouteName(name));
  return [
    "",
    "export const ROUTES: RoutePath[] = [",
    splittedPaths.map((_sp, index) => `${JSON.stringify(routes[index].name)},`),
    "]",
  ];
}

function createAccessArguments(routes: Route[]) {
  const args: Array<[route: string, access: string]> = routes
    .filter((route) => route.access)
    .map((route) => [route.name, `Access${route.id}`]);
  return args.map(([route, access]) => `[${JSON.stringify(route)}, ${access}]`);
}
