const chalk = require("chalk");
const glob = require("glob");
const path = require("path");
const fs = require("fs");
const slash = require("slash2");
const lib = require("umi-library");

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
      `import ${fileName} from "./${slash(
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
  let mockFiles = glob.sync("**/**_mock.ts", {
    cwd: mockPath,
    ignore: "* node_modules"
  });
  // mockFiles = mockFiles.concat(
  //   glob.sync("../src/**/**/_mock.ts", {
  //     cwd: mockPath,
  //     ignore: "* node_modules"
  //   })
  // );
  console.log("get files: " + chalk.green(mockFiles.join(", ")));
  const allMockText = importMockFiles(mockFiles, mockPath);
  fs.writeFileSync(allMock, allMockText);
  lib
    .build({
      cwd: __dirname,
      watch: false,
      buildArgs: {
        cjs: "rollup",
        entry: "allMock.ts"
      }
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
  // or write the bundle to disk
  console.log(chalk.yellow("-".repeat(80)));
  console.log(chalk.blue("finish merge file"));
}
module.exports = build;
