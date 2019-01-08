const rollup = require("rollup");
const json = require("rollup-plugin-json");
const chalk = require("chalk");
const babel = require("rollup-plugin-babel");
const builtins = require("rollup-plugin-node-builtins");
const glob = require("glob");
const path = require("path");
const fs = require("fs");

const allMock = path.join(__dirname, "./allMock.js");

const inputOptions = {
  input: allMock,
  onwarn(warning) {},
  plugins: [
    builtins(),
    json({
      preferConst: true, // Default: false
      indent: "  "
    }),
    babel({
      babelrc: false,
      runtimeHelpers: true,
      presets: [
        [
          "@babel/env",
          {
            targets: {
              node: "6.11.5"
            },
            modules: false
          }
        ]
      ]
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
    const fileName = filePath.replace(".js", "");
    importString.push(
      `import ${fileName} from "${path.join(mockPath, filePath)}";`
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
  const mockFiles = glob.sync("**/*.js", {
    cwd: mockPath
  });
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
  console.log(chalk.blue("finsh merge file"));
}

module.exports = build;
