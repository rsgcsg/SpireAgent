import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gradeCompatibilityReport } from "./lib/connector-compatibility-grader.mjs";

const argumentsMap = parseArguments(process.argv.slice(2));
const reportPath = required("--report");
const scenarioPath = required("--scenario");
const report = JSON.parse(await readFile(path.resolve(reportPath), "utf8"));
const scenario = JSON.parse(await readFile(path.resolve(scenarioPath), "utf8"));
const grade = gradeCompatibilityReport(report, scenario);
const output = `${JSON.stringify(grade, null, 2)}\n`;

if (argumentsMap.has("--output")) {
  await writeFile(path.resolve(argumentsMap.get("--output")), output, "utf8");
}
process.stdout.write(output);
if (grade.status !== "pass") {
  process.exitCode = 2;
}

function required(name) {
  const value = argumentsMap.get(name);
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function parseArguments(values) {
  const result = new Map();
  for (let index = 0; index < values.length; index += 2) {
    if (!values[index]?.startsWith("--") || values[index + 1] === undefined) {
      throw new Error(`Invalid argument near ${values[index] ?? "<end>"}.`);
    }
    result.set(values[index], values[index + 1]);
  }
  return result;
}
