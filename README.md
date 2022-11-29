![Logo](https://raw.githubusercontent.com/Mario-35/STEAN/main/doc/assets/logo.png "Logo")

## SensorThings Enhanced API Node

![Inrae](https://raw.githubusercontent.com/Mario-35/STEAN/main/doc/assets/inrae.png "Inrae")

## Want to use this project?

# 1 : If you want to use or test :

# 2 : If you want to get source code :

1. Fork/Clone
2. Install dependencies - npm install
3. Fire up Postgres on the default ports
4. Make configuration/config.json file (see config.json.example)
5. npm run dev for dev, npm run build (vs script package.json)
6. If database not exists the program create it.

The project run under nodeJS.

![Nodejs](https://raw.githubusercontent.com/Mario-35/STEAN/main/doc/assets/nodejs.png "Nodejs")

Is 100% typescript, the javascript is used for TDD only and apidoc.

![TypeScript](https://raw.githubusercontent.com/Mario-35/STEAN/main/doc/assets/ts.png "TypeScript") ![Javascript](https://raw.githubusercontent.com/Mario-35/STEAN/main/doc/assets/js.png "Javascript")

For views a little :

![HTML JS CSS](https://raw.githubusercontent.com/Mario-35/STEAN/main/doc/assets/html.png "HTML JS CSS")

## Directory Structure

```js
📦src
 ┣ 📂server // API Server
 ┃ ┣ 📂configuration // Configuration Server
 ┃ ┃ ┣ 📜.key // crypt Key
 ┃ ┃ ┗ config.json // config file
 ┃ ┣ 📂db
 ┃ ┃ ┣ 📂createDBDatas // datas to create blank Database
 ┃ ┃ ┣ 📂dataAccess
 ┃ ┃ ┣ 📂entities // SensorThings entities
 ┃ ┃ ┣ 📂helpers
 ┃ ┃ ┣ 📂interfaces
 ┃ ┃ ┗ 📜constants.ts // Constants for DB
 ┃ ┣ 📂helpers // Application helpers
 ┃ ┣ 📂logger // Logs tools
 ┃ ┣ 📂lora // Specific lora entity
 ┃ ┣ 📂odata // Odata decoder
 ┃ ┃ ┣ 📂parser // Odata parser
 ┃ ┃ ┗ 📂visitor //  Odata decoder process
 ┃ ┃   ┗📂helpers
 ┃ ┣ 📂public // public HTTP pages
 ┃ ┣ 📂routes // routes API
 ┃ ┃ ┣ 📜favicon.ico // Icon
 ┃ ┃ ┣ 📜protected.ts // protected routes
 ┃ ┃ ┗ 📜unProtected.ts // open routes
 ┃ ┣ 📂types // data types
 ┃ ┣ 📂views // generated views
 ┃ ┃ ┣ 📂admin // admin pages
 ┃ ┃ ┣ 📂css // CsS filse
 ┃ ┃ ┣ 📂graph // graph views
 ┃ ┃ ┣ 📂helpers
 ┃ ┃ ┣ 📂js // JS filse
 ┃ ┃ ┣ 📂maker // Query maker
 ┃ ┃ ┗ 📂query // Query view
 ┃ ┣ 📜constants.ts // App constants
 ┃ ┣ 📜db.ts // DB connection(s)
 ┃ ┗ 📜index.ts // starting file
 ┣ 📂template // ApiDoc template
 ┣ 📂test
 ┃ ┣ 📂integration // Tests
 ┃ ┃ ┗ 📂files // files For importation tests
 ┃ ┣ 📜apidoc.json // Apidoc configuration
 ┃ ┗ 📜dbTest.ts // DB test connection
 ┗ 📜build.js // js file for building app
```

## Tech Stack

-   [Node.js](https://nodejs.org/) `v14.15.1`
-   [PostgreSQL](https://www.postgresql.org/)
-   [Knex.js](https://knexjs.org/)
-   [pg](https://node-postgres.com/)
-   [pg-copy-streams](https://github.com/brianc/node-pg-copy-streams#readme)
-   [json2csv](https://mircozeiss.com/json2csv/)
-   [busboy](https://github.com/mscdex/busboy)
-   [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

---

-   [koa](https://koajs.com/)
-   [koa-bodyparser](https://github.com/koajs/bodyparser)
-   [koa-bodyparser](https://github.com/koajs/cors)
-   [koa-compress](https://github.com/koajs/compress)
-   [koa-html-minifier](https://github.com/koajs/html-minifier)
-   [koa-json](https://github.com/koajs/json)
-   [koa-helmet](https://github.com/venables/koa-helmet)
-   [koa-logger](https://github.com/koajs/logger)
-   [koa-router](https://github.com/koajs/router)
-   [koa-session](https://github.com/koajs/session)
-   [koa-passport](https://github.com/rkusa/koa-passport)
-   [koa-static](https://github.com/koajs/static)
-   [@koa/cors](https://github.com/koajs/cors)
-   [passport-local](https://github.com/jaredhanson/passport-local)
