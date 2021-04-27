import fs from "fs";
import prettier from "prettier";

import plugin from "../src/plugin";

const cases: string[] = [];
let current: string[] = [];

fs.readFileSync("./test/cases.c", "utf-8").split("\n").forEach((line) => {
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

    const actual = prettier.format(expected, { parser: "c", plugins: [plugin] });

    expect(actual).toEqual(expected);
  });
});
