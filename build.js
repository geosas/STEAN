"use strict";
const minify = require("@node-minify/core");
const htmlMinifier = require("@node-minify/html-minifier");
const jsonminify = require('@node-minify/jsonminify');
const cleanCSS = require("@node-minify/clean-css");

var UglifyJS = require("uglify-js");

var globby = require("globby");
var path = require("path");
var extend = require("extend");
var fs = require("graceful-fs");
var mkdirp = require("mkdirp");

var archiver = require("archiver");


const encrypt = (text, key) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-ctr", String(key), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString("hex")}.${encrypted.toString("hex")}`;
};

var defaultOptions = {
  comments: true,
  output: "js",
  extension: ".js",
  patterns: ["**/*.js"],
  configFile: null,
  callback: null,
  logLevel: "info",
  removeAttributeQuotes: true
};

function isEmpty(str) {
  if (typeof str != "string" || str.trim() == "") {
    return true;
  }
  return false;
}

function readFile(path) {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (e) {
    console.error("UGLIFYJS FOLDER ERROR: ", path, "was not found !");
    return "";
  }
}

function copyFileSync( source, target ) {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    // Check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    // Copy
    if ( fs.lstatSync( source ).isDirectory() ) {
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}
}

function writeFile(filePath, code) {
  mkdirp(path.dirname(filePath)).then(function () {
    fs.writeFile(filePath, code, function (err) {
      if (err) {
        console.error("Error: " + err);
        return;
      }
      console.log(`\x1b[36m File \x1b[33m ${filePath}\x1b[32m written successfully !\x1b[0m`);
    });
  })
  .catch(function (err) {
    console.log(`\x1b[31m Error \x1b[34m : \x1b[33m ${err}\x1b[0m`);
  });
  
} 

function zipDirectory(source, out) {
  const archive = archiver("zip", { zlib: { level: 9 }});
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", err => reject(err))
      .pipe(stream)
    ;

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

function ugly (dirPath, options) {
  options = extend({}, defaultOptions, options);
  var state = {
    processCounter: 0,
    logLevel: options.logLevel,
    callback: options.callback
  };
  
  // grab and minify all the js files
  var files = globby.sync(options.patterns, {
    cwd: dirPath
  });
  
  // minify each file individually
  files.forEach(function (fileName) {
    options.output = isEmpty(options.output) ? "_out_" : options.output;
    var newName = path.join(options.output, path.dirname(fileName), path.basename(fileName, path.extname(fileName))) + options.extension;
    var originalCode = readFile(path.join(dirPath, fileName));

    minify({
      compressor: options.compressor,
      content: originalCode,
      options: options,options,
    }).then(function(min) {
      writeFile(newName, min);
    });
   });
}

function uglyJs (dirPath) {
  var files = globby.sync(["**/*.js"], {
    cwd: dirPath
  });
  
  // minify each file individually
  files.forEach(function (fileName) {

    const newName = path.join(dirPath, path.dirname(fileName), path.basename(fileName, path.extname(fileName))) + ".js";
    const originalCode = readFile(path.join(dirPath, fileName));
    const temp = UglifyJS.minify(originalCode);
    if (temp.error) console.log(`\x1b[31m Error \x1b[34m : \x1b[33m ${temp.error}\x1b[0m`);
    writeFile(newName, temp.code);
   });
}

copyFolderRecursiveSync("./src/apidoc", "build/");
copyFolderRecursiveSync("./src/server/views/js", "build/views");
copyFolderRecursiveSync( "./src/server/views/css", "build/views" );
copyFileSync( "./src/server/views/query/query.html", "build/views/query/" );
copyFileSync( "./src/server/configuration/.key", "build/configuration/" );
copyFileSync( "./src/server/routes/favicon.ico", "build/routes/" );

const packageJson = require("./package.json");
delete packageJson.scripts;
delete packageJson.devDependencies;
delete packageJson.apidoc;
fs.writeFileSync("build/package.json", JSON.stringify(packageJson, null, 2), {
    encoding: "utf-8"
});

if (process.argv.includes("ugly")) {
  ugly("./build/apidoc", {
    compressor: htmlMinifier ,
    output: "build/apidoc",
    extension: ".html",
    patterns: ["**/*.html"],
    options: {
      removeAttributeQuotes: true,
      collapseInlineTagWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true
    }
  });

  ugly("./build/apidoc", {
    compressor: jsonminify ,
    output: "build/apidoc",
    extension: ".json",
    patterns: ["**/*.json"],
      options: {
      removeAttributeQuotes: true,
      collapseInlineTagWhitespace: true,
      removeComments: true
    }
  });

  ugly("./build/apidoc", {
    compressor: cleanCSS ,
    output: "build/apidoc",
    extension: ".css",
    patterns: ["**/*.css"],
      options: {
      removeAttributeQuotes: true,
      collapseInlineTagWhitespace: true,
      removeComments: true
    }
  });

  uglyJs("./build");
}

try {
  const temp =  fs.readFileSync(path.join("./src/server/configuration/", "config.json"), "utf-8");
  const input = JSON.parse(temp);
  const retValue = input["production"];
  fs.writeFileSync("build/configuration/config.json", JSON.stringify(retValue, null, 2), {
      encoding: "utf-8"
  });
  console.log("\x1b[36m configuration \x1b[34m : \x1b[37m Ok\x1b[0m");
} catch (error) {
  console.log("\x1b[31m configuration \x1b[34m : \x1b[37m not write\x1b[0m");
}

zipDirectory("./build", "dist.zip").then(function (e) {
  console.log("\x1b[36m compression \x1b[34m : \x1b[37m dist.zip\x1b[0m");
});
