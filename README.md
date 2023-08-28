# build-react-routes

Create routes based on the folder structure

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

## Folder structure

You first have to choose folder to reflect your routes. for instance `src/app`.
All subfolders will be pathes of the routes if they contain a `page.tsx` or `page.mdx` file, with these exceptions:

* Every folder starting with an underscore (`_`) will be ignored. And its content will not be scanned.
* Every folder starting with an open parenthesis will not be a path of the route. But its content will be scanned.

Here is an example of folder structure:

```text
src/
┗━ app/
   ┣━ (articles)/
      ┣━ plates/
         ┗━ page.mdx
      ┗━ glasses/
         ┗━ page.tsx
         ┣━ _common_/
            ┣━ config/
               ┗━ page.tsx
            ┗━ page.tsx
         ┣━ beer/
            ┗━ page.mdx
         ┣━ wine/
         ┗━ juice/
            ┗━ page.mdx
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

## Relative paths

If the path does not start with a `/`,
that means that it is relative to the current path.

For instance, if you have this folder structure:

```text
src/
┗━ app/
   ┣━ (articles)/
      ┗━ glasses/
         ┗━ page.mdx
         ┣━ beer/
            ┗━ page.mdx
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
