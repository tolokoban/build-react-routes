# build-react-routes

Create lightweight routes based on conventions inspired by
[NextJS App Router](https://nextjs.org/docs/app).

## Usage

```bash
npx @tolokoban/build-react-routes ./src/app
```

The script will watch the given folder and generate an `index.tsx` file in it.
You can use it as your main app component:

```ts
import { createRoot } from "react-dom/client"
import App from "./app"

createRoot(document.body).render(<App />)
```

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
* You cannot use parameters (yet).

## Why don't you just use NextJs or ReactRouter?

If you like the way NextJS deals with routes but cannot afford
to install it in your production environment,
then `build-react-routes` can be the cheapest solution.

This solution is best suited for rich documentations written in Markdown.
