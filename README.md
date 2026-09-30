# build-react-routes

Create lightweight routes based on conventions inspired by
[NextJS App Router](https://nextjs.org/docs/app).

## Usage

```bash
npx @tolokoban/build-react-routes ./src/app
npx @tolokoban/build-react-routes ./src/app --watch
npx @tolokoban/build-react-routes ./src/app --watch --after "npm run do_something"
```

Argument `--after` (or `-a` in short) allows you to execute a command anytime a route has been generated.

The script will inspect the given folder and generate an `index.tsx` file in it.
You can use it as your main app component:

```ts
import { createRoot } from "react-dom/client"
import App from "./app"

createRoot(document.body).render(<App />)
```

If you want to use nultiple languages, you can pass the current one as a prop:

```ts
createRoot(document.body).render(<App lang={navigator.language}/>)
```

You can get the params from the props or with this hook:

```ts
import { useRouteParams } from "./app"

export default function Page({ params }: { params: Record<string, string> }) {
    const params2 : Record<string, string> = useRouteParams()
}
```

The hook is more suited when used inside another hook that do no propagate the `params` argument.

## Folders conventions

You first have to choose folder to reflect your routes. for instance `src/app`.
All subfolders will be pathes of the routes if they contain a `page.tsx` or `page.mdx` file, with these exceptions:

* Every folder starting with an underscore (`_`) will be ignored. And its content will not be scanned.
* Every folder starting with an open parenthesis will not be a path of the route. But its content will be scanned.

Here is an example of folder structure:

```text
src/
┗━ app/
   ┣━ (articles)/
   ┃  ┣━ plates/
   ┃  ┃  ┗━ page.mdx
   ┃  ┗━ glasses/
   ┃     ┣━ access.tsx
   ┃     ┣━ page.tsx
   ┃     ┣━ _common_/
   ┃     ┃  ┣━ config/
   ┃     ┃  ┃  ┗━ page.tsx
   ┃     ┃  ┗━ page.tsx
   ┃     ┣━ beer/
   ┃     ┃  ┗━ page.mdx
   ┃     ┣━ wine/
   ┃     ┗━ juice/
   ┃        ┗━ page.mdx
   ┣━ welcome/
   ┗━ test/
      ┗━ garbage/
         ┗━ page.tsx
```

And here are the resulting routes:

* `http://localhost/#/plates`
* `http://localhost/#/glasses`
* `http://localhost/#/glasses/beer`
* `http://localhost/#/glasses/juice`
* `http://localhost/#/test/garbage`

## Filenames conventions

In the `src/app` folder (or any other you have specified),
some files have special meanings:

* `page.tsx`: The component to display when we reach this route.
Must export a default function which returns a React component without any property.
If a folder contains a `page.tsx`, it will generate a route.
* `page.mdx`: Instead of writing the code for the component, you can let
[MDX](https://mdxjs.com/) generate one based on the
[Markdown](https://commonmark.org/) you provide in a `page.mdx` file.
* `layout.tsx`: A layout is a UI that is shared between multiple pages. On navigation, layouts preserve state, remain interactive, and do not re-render. Layouts can also be nested. Must export a default function which returns a React compoment with a `children: React.ReactNode` property.
* `loading.tsx`: The component to display while `page.tsx` (or `page.mdx`) is loading.
* `access.tsx`: Looks like the `layout.tsx` file. But it won't be nested. Only the one nearest to the current path will be applied.
This is usefull if you want to display a login page for routes that must be protected.
* `404.tsx`: A component displayed if the route does not exist. If only a part of the route exists, the `404.tsx` file is searched in it and in the parents after.

## Multilingual pages

You are supposed to write your website in the "default" language and then add translations if you need them.

For example, if your are writing in english and need an italian translation, you will write `page.tsx` and `page.it.tsx`.
This works also for `layout` and `loading`.

The file resolution for `en-US` will be to search the files in this order:

* `page.en-US.mdx`
* `page.en-US.tsx`
* `page.en.mdx`
* `page.en.tsx`
* `page.mdx`
* `page.tsx`

## Params

Let's look at the file `src/app/tasks/[taskId]/page.tsx`:

```ts
export default function Page({ params }: { params: Record<string, string> }) {
    const taskId = parseInt(params.taskId, 10)
    const tasks = listTasks()
    const task = tasks[taskId]
    return (
        <div>
            <h1>{task}</h1>
            <a href="#..">Back</a>
        </div>
    )
}
```

You can notice that the path has an item with square brackets (`[taskId]`).
This item matches any string and stores it in a `params` object that we can read
in any `page.tsx` and `layout.tsx`.

## Relative paths

If the path does not start with a `/`,
that means that it is relative to the current path.

For instance, if you have this folder structure:

```text
src/
┗━ app/
   ┣━ (articles)/
      ┗━ glasses/
         ┣━ page.mdx
         ┣━ beer/
         ┃  ┗━ page.mdx
         ┗━ wine/
            ┗━ page.mdx
```

Then you can have this content for `src/app/(articles)/glasses/page.mdx`:

```md
# We sell glasses

* (for beer)[#/glasses/beer]
* (for wine)[#/glasses/wine]
```

but also this one (using relative pathes):

```md
# We sell glasses

* (for beer)[#beer]
* (for wine)[#wine]
```

## How to use it with **rspack**

Add this in your `rspack.config.mjs` as first element of section **plugins**:

```ts
new Rspack.ProgressPlugin(),
/** @type {Rspack.RspackPluginInstance} */
({
    apply(compiler) {
        compiler.hooks.beforeCompile.tapAsync(
            "build-react-routes-plugin",
            /** @param {unknown} _params @param {() => void} done */
            (_params, done) => {
                execSync("npx build-react-routes ./src/app/", { stdio: "inherit" })
                done()
            }
        )
    },
}),
```

## Limitations

* Routing works only with hashes.
* Typescript only.

## Why don't you just use NextJs or ReactRouter?

If you like the way NextJS deals with routes but cannot afford
to install it in your production environment,
then `build-react-routes` can be the cheapest solution.

This solution is best suited for rich documentations written in Markdown.

## Release notes

### v0.12.3

* Layouts are now properly nested: a parent `layout.tsx` wraps all its sub-routes, not only its own page.
* A page now uses its own `loading.tsx`, `layout.tsx` and `access.tsx`, instead of its parent's `loading.tsx`.
* `access.tsx` is now rendered inside the parent layouts, so a login page keeps the surrounding UI.

### v0.12.1

* Fix non nested layouts.

### v0.12.0

* Access mechanism rewritten.

### v0.11.1

* Fix routes collision issue. Before, if you had two routes `#/foo/bar` and `#/foo/barbarian`, then you always got 404 for the second one.

### v0.11.0

* You can now have a `404.tsx` file to catch invalid pathes.
