const rollup = require("rollup");
const json = require("rollup-plugin-json");
const chalk = require("chalk");
const babel = require("rollup-plugin-babel");
const glob = require("glob");
const path = require("path");
const fs = require("fs");
const slash = require("slash2");

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const firstUpperCase = pathString => {
  return pathString
    .replace(".", "")
    .split(/\/|\-/)
    .map(s => s.toLowerCase().replace(/( |^)[a-z]/g, L => L.toUpperCase()))
    .filter(s => s)
    .join("");
};
const getArrayLastTwo = fileNameArray => {
  const nameArray = [];
  nameArray.push(fileNameArray.pop());
  nameArray.push(fileNameArray.pop());
  return firstUpperCase(nameArray.join("/"));
};

const allMock = path.join(__dirname, "./allMock.ts");

const inputOptions = {
  input: allMock,
  onwarn(warning) {},
  plugins: [
    json({
      preferConst: true, // Default: false
      indent: "  "
    }),
    babel({
      extensions,
      babelrc: false,
      presets: ["@babel/env", "@babel/preset-typescript"]
    })
  ]
};
const outputOptions = {
  file: "./mock.js",
  format: "umd",
  name: "mock"
};
const importMockFiles = (mockFiles, mockPath) => {
  const importString = [];
  const dataString = [];
  mockFiles.forEach(filePath => {
    const fileName = getArrayLastTwo(
      filePath
        .replace(".ts", "")
        .replace("_", "")
        .split("/")
    );
    importString.push(
      `import ${fileName} from "${slash(
        path.join(mockPath, filePath.replace(".ts", ""))
      )}";`
    );
    dataString.push(`...${fileName}`);
  });
  return `
  ${importString.join("\n")}

  const data = {${dataString.join(",")}};

  export default data;
  `;
};

async function build(mockPath, outputfile) {
  let mockFiles = glob.sync("**/*.ts", {
    cwd: mockPath
  });
  mockFiles = mockFiles.concat(
    glob.sync("../src/**/**/_mock.ts", {
      cwd: mockPath,
      ignore: "* node_modules"
    })
  );
  console.log("get files: " + chalk.green(mockFiles.join(", ")));
  const allMockText = importMockFiles(mockFiles, mockPath);
  fs.writeFileSync(allMock, allMockText);
  // create a bundle
  const bundle = await rollup.rollup(inputOptions);
  // generate code and a sourcemap
  outputOptions.file = outputfile;
  await bundle.generate(outputOptions);
  // or write the bundle to disk
  await bundle.write(outputOptions);
  console.log(chalk.yellow("-".repeat(80)));
  console.log(chalk.blue("finish merge file"));
}
module.exports = build;
