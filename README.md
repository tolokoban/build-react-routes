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
* `layout.tsx`: A layout is UI that is shared between multiple pages. On navigation, layouts preserve state, remain interactive, and do not re-render. Layouts can also be nested. Must export a default function which returns a React compoment with a `children: React.ReactNode` property.
* `loading.tsx`: The component to display while `page.tsx` (or `page.mdx`) is loading.
* `access.ts`: A function to check is the access for this path is authorized.

## Authorization

Along side with any `page.tsx` file, you can add a `access.ts` file that looks like
the following example:

```ts
export default async function access(path: RoutePath): Promise<RoutePath | undefined> {
    if (path.startsWith("/doc")) return

    const isLogged = await checkLogin()
    if (!isLogged) return "/login"
}
```

The function gets the route the user wants to reach.
And it returns the route the user will actually reach.

Returning `undefined` means that the wanted route is accepted.

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

## Limitations

* Routing works only with hashes.
* Typescript only.

## Why don't you just use NextJs or ReactRouter?

If you like the way NextJS deals with routes but cannot afford
to install it in your production environment,
then `build-react-routes` can be the cheapest solution.

This solution is best suited for rich documentations written in Markdown.
