import { describe, expect, it } from "vitest";
import Path from "node:path";
import { browseRoutes } from "./routes";
import { Route } from "./types";

const APP_PATH = Path.resolve(__dirname, "../../usecases/app");

const NO_LANG = {
  page: ["_"],
  layout: ["_"],
  loading: ["_"],
  template: ["_"],
};

/**
 * Remove the circular `parent` reference to make comparisons easier.
 */
function simplify(route: Route): Omit<Route, "parent" | "children"> & {
  children: unknown[];
} {
  const { parent, children, ...rest } = route;
  return { ...rest, children: children.map(simplify) };
}

function expected(
  id: number,
  relPath: string,
  name: string,
  props: Partial<Route>,
  children: unknown[] = [],
) {
  return {
    id,
    path: Path.resolve(APP_PATH, relPath),
    name,
    layout: false,
    loading: false,
    template: false,
    notFound: false,
    access: false,
    languages: NO_LANG,
    ...props,
    children,
  };
}

describe("browseRoutes()", () => {
  it("should build the routes tree of usecases/app", async () => {
    const root = await browseRoutes(APP_PATH);
    expect(simplify(root)).toEqual(
      expected(0, ".", "/", { page: "tsx", notFound: true, access: true }, [
        expected(1, "bill", "/bill", { page: "tsx" }, [
          expected(2, "bill/(group)/test", "/bill/test", { page: "mdx" }),
        ]),
        expected(
          3,
          "organization",
          "/organization",
          {
            page: "tsx",
            loading: true,
            languages: {
              ...NO_LANG,
              loading: ["_", "fr"],
            },
          },
          [
            expected(4, "organization/[id]", "/organization/[id]", {
              page: "tsx",
            }),
          ],
        ),
        expected(5, "user", "/user", { notFound: true }, [
          expected(6, "user/[id]", "/user/[id]", { page: "tsx" }, [
            expected(7, "user/[id]/[activation]", "/user/[id]/[activation]", { page: "tsx" }),
          ]),
          expected(8, "user/list", "/user/list", { page: "tsx", access: true }),
        ]),
      ]),
    );
  });

  it("should link every child to its parent", async () => {
    const root = await browseRoutes(APP_PATH);
    expect(root.parent).toBeUndefined();
    const check = (route: Route) => {
      for (const child of route.children) {
        expect(child.parent).toBe(route);
        check(child);
      }
    };
    check(root);
  });

  it("should restart ids from 0 on each call", async () => {
    await browseRoutes(APP_PATH);
    const root = await browseRoutes(APP_PATH);
    expect(root.id).toBe(0);
  });
});
