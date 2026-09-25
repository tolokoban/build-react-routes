import Path from "node:path";
import { saveText } from "../fs";
import { Route } from "../types";
import { CodeSection, codeLinesToString } from "../code";
import { CODE_FOR_INDEX_HEAD, CODE_FOR_INDEX_TAIL } from "../templates";
import { DISCLAIMER } from "./disclaimer";

/**
 * `index.tsx` file owns the root component for the application.
 */
export async function writeIndexFile(rootPath: string, routes: Route[]) {
  const [firstRoute] = routes;
  const routesWithPages = routes.filter(({ page }) => Boolean(page));
  const hasAnyNotFound = routes.some((r) => r.notFound);
  const defaultNotFound = hasAnyNotFound
    ? []
    : [
        `function DefaultNotFound() { return <p>Please add a <code>404.tsx</code> file in <code>${Path.basename(rootPath)}/</code>.</p> }`,
      ];
  await saveText(
    Path.resolve(rootPath, "index.tsx"),
    codeLinesToString([
      ...DISCLAIMER,
      CODE_FOR_INDEX_HEAD,
      ...getCodeToImportContainer(routes, "layout", rootPath),
      ...getCodeToImportContainer(routes, "loading", rootPath),
      ...getCodeToImportContainer(routes, "template", rootPath),
      ...getCodeToImportAccess(routes, rootPath),
      ...getCodeToImportNotFound(routes, rootPath),
      ...defaultNotFound,
      ...routesWithPages.map((route) =>
        route.languages.page
          .map(
            (lang, index) =>
              `const Page${route.id}${
                index > 0 ? `_${index}` : ""
              } = React.lazy(() => import("./${Path.join(
                Path.relative(rootPath, route.path),
                pageName(route, lang),
              )}"))`,
          )
          .join("\n"),
      ),
      "",
      "// eslint-disable-next-line @typescript-eslint/no-unused-vars",
      "export default function App({ lang }: { lang?: string }) {",
      [
        `const context = useRouteContext()`,
        ...createMultiLangElements(routes),
        "return (",
        createRoutesTree(firstRoute, hasAnyNotFound),
        ")",
      ],
      "}",
      CODE_FOR_INDEX_TAIL,
    ]),
  );
}

function getCodeToImportContainer(
  routes: Route[],
  key: keyof Route["languages"],
  rootPath: string,
): string[] {
  const prop = `${key.charAt(0).toUpperCase()}${key.substring(1)}`;
  return routes
    .filter((route) => Boolean(route[key]))
    .map((route) =>
      route.languages[key]
        .map((lang, index) => {
          const path = Path.join(Path.relative(rootPath, route.path), key);
          const name = `${prop}${route.id}`;
          if (index === 0) return `import ${name} from "./${path}"`;
          return `import ${name}_${index} from "./${path}.${lang}"`;
        })
        .join("\n"),
    );
}

function getCodeToImportNotFound(routes: Route[], rootPath: string): string[] {
  return routes
    .filter((route) => route.notFound)
    .map((route) => {
      const path = Path.join(Path.relative(rootPath, route.path), "404");
      return `import NotFound${route.id} from "./${path}"`;
    });
}

function getCodeToImportAccess(routes: Route[], rootPath: string): string[] {
  return routes
    .filter((route) => route.access)
    .map((route) => {
      const path = Path.join(Path.relative(rootPath, route.path), "access");
      return `import Access${route.id} from "./${path}"`;
    });
}

function pageName(route: Route, lang: string): string {
  const extension = route.page;
  if (!extension || extension === "tsx") return "page";

  return `page${lang === "_" ? "" : `.${lang}`}.${extension}`;
}

function makeProp(route: Route, key: keyof Route["languages"], varName: string): string {
  if (!route[key]) return "";

  return `${varName}${route.id}`;
}

function makeIntl(id: number, languages: string[], name: string, isElement = false) {
  const wrap = isElement ? (t: string) => `<${t}/>` : (t: string) => t;
  const base = `${name}${id}`;
  if (languages.length < 2) return wrap(base);

  return `intl(${wrap(`${base}`)}, {${languages
    .map((lang, index) => (index === 0 ? null : `"${lang}": ${wrap(`${base}_${index}`)}`))
    .filter((item) => item !== null)
    .join(", ")}}, lang)`;
}

function createMultiLangElements(routes: Route[]): CodeSection[] {
  const code: CodeSection[] = [];
  let hasRootLoading = false;
  routes.forEach((route) => {
    if (route.loading) {
      if (route.id === 0) hasRootLoading = true;
      code.push(`const fb${route.id} = ${makeIntl(route.id, route.languages.loading, "Loading")}`);
    }
    if (route.layout) {
      code.push(`const ly${route.id} = ${makeIntl(route.id, route.languages.layout, "Layout")}`);
    }
    if (route.template) {
      code.push(
        `const tp${route.id} = ${makeIntl(route.id, route.languages.template, "Template")}`,
      );
    }
    if (route.page) {
      code.push(`const pg${route.id} = ${makeIntl(route.id, route.languages.page, "Page")}`);
    }
  });
  if (!hasRootLoading) code.unshift("const fb = <div>Loading...</div>");
  return code;
}

function createRoutesTree(route: Route, hasAnyNotFound: boolean): CodeSection {
  const loading = getLoading(route);
  const access = getAccess(route);
  const template = getTemplate(route);
  let notFound = getNotFound(route);
  if (!notFound && !route.parent && !hasAnyNotFound) notFound = "DefaultNotFound";
  const def: string[] = [
    makeProp(route, "page", "pg"),
    makeProp(route, "layout", "ly"),
    loading,
    access,
    notFound,
  ].map((item) => (item ? item : ""));
  let routeCode = `Route path="${route.name}" def={[${def.join(", ")}]}`;
  return route.children.length > 0
    ? [
        `<${routeCode} context={context}>`,
        ...route.children.map((child) => createRoutesTree(child, hasAnyNotFound)),
        `</Route>`,
      ]
    : [`<${routeCode} context={context}/>`];
}

function getLoading(route: Route) {
  let current: Route | undefined = route;
  while (current) {
    if (current.loading) {
      return `fb${current.id}`;
    }
    current = current.parent;
  }
  return "fb";
}

function getAccess(route: Route) {
  let current: Route | undefined = route;
  while (current) {
    if (current.access) {
      return `Access${current.id}`;
    }
    current = current.parent;
  }
  return "";
}

function getTemplate(route: Route) {
  let template: string | null = null;
  let current: Route | undefined = route;
  while (current) {
    if (current.template) {
      template = `tp${current.id}`;
      break;
    }
    current = current.parent;
  }
  return template;
}

function getNotFound(route: Route): string {
  let current: Route | undefined = route;
  while (current) {
    if (current.notFound) return `NotFound${current.id}`;
    current = current.parent;
  }
  return "";
}
