const rollup = require("rollup");
const json = require("rollup-plugin-json");
const babel = require("rollup-plugin-babel");
const builtins = require("rollup-plugin-node-builtins");
const glob = require("glob");
const path = require("path");
const fs = require("fs");

const allMock = path.join(__dirname, "./allMock.js");

const inputOptions = {
  input: allMock,
  plugins: [
    builtins(),
    json({
      preferConst: true, // Default: false
      indent: "  "
    }),
    babel({
      exclude: "node_modules/**",
      babelrc: false,
      runtimeHelpers: true,
      presets: ["umi"]
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
    dataString.push(`${fileName}`);
  });
  return `
${importString.join("\n")}

const data = Object.assign({},dataString.join);

export default data;
`;
};

async function build(mockPath, outputfile) {
  const mockFiles = glob.sync("**/*.js", {
    cwd: mockPath
  });
  const allMockText = importMockFiles(mockFiles, mockPath);
  fs.writeFileSync(allMock, allMockText);
  // create a bundle
  const bundle = await rollup.rollup(inputOptions);
  // generate code and a sourcemap
  outputOptions.file = outputfile;
  await bundle.generate(outputOptions);
  // or write the bundle to disk
  await bundle.write(outputOptions);
}

module.exports = build;
