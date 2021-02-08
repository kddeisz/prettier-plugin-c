const fs = require("fs");
const prettier = require("prettier");

const lines = fs.readFileSync("./test/cases.c", "utf-8").split("\n");
const cases = [];

let current = [];
lines.forEach((line) => {
  if (line.length === 0) {
    cases.push(current.join("\n  "));
    current = [];
  } else {
    current.push(line);
  }
});

describe("cases", () => {
  test.each(cases)("%s", (code) => {
    const expected = [
      "int main() {",
      `  ${code}`,
      "}",
      ""
    ].join("\n");

    const actual = prettier.format(expected, { parser: "c", plugins: ["."] });

    expect(actual).toEqual(expected);
  });
});
