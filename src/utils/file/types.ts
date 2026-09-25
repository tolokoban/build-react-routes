import Path from "node:path";
import { saveText } from "../fs";
import { Route } from "../types";
import { codeLinesToString } from "../code";
import { CODE_FOR_TYPES } from "../templates";
import { DISCLAIMER } from "./disclaimer";

export async function writeTypesFile(rootPath: string, routes: Route[]) {
  const routesNames = routes.map(({ name }) => name);
  await saveText(
    Path.resolve(rootPath, "types.ts"),
    codeLinesToString([
      ...DISCLAIMER,
      "export type RoutePath =",
      routesNames.map((name) => `| ${JSON.stringify(name)}`),
      "",
      `export function isRoutePath(path: string): path is RoutePath {`,
      [`return ${JSON.stringify(routesNames)}.includes(path)`],
      "}",
      CODE_FOR_TYPES,
    ]),
  );
}
