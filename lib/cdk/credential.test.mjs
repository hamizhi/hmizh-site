import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("./credential.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { parseCdkCredential } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

test("ChatGPT auth/session JSON uses access_token mode", () => {
  assert.deepEqual(
    parseCdkCredential('{"user":{"id":"user-1"},"accessToken":"  eyJ.test.sig  "}'),
    { mode: "access_token", accessToken: "eyJ.test.sig" },
  );
});

test("sessionToken takes priority when both tokens exist", () => {
  assert.deepEqual(
    parseCdkCredential('{"sessionToken":"session-value","accessToken":"access-value"}'),
    { mode: "session", session: "session-value" },
  );
});

test("plain session token remains supported", () => {
  assert.deepEqual(parseCdkCredential(" session-value "), {
    mode: "session",
    session: "session-value",
  });
});

test("invalid or incomplete JSON is rejected without contacting upstream", () => {
  for (const value of ["", "{}", '{"user":{"id":"user-1"}}', '{"accessToken":', "[]"]) {
    assert.equal(parseCdkCredential(value), null);
  }
});
