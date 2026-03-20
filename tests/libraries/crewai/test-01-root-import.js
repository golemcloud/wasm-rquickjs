import assert from "assert";

export const run = async () => {
  let importError = null;
  try {
    await import("crewai");
  } catch (error) {
    importError = error;
  }

  assert(importError, "Expected importing `crewai` to fail");
  const message = String(importError?.message ?? importError);
  assert(
    /Unexpected token|Unexpected identifier|ERR_UNKNOWN_FILE_EXTENSION|Cannot find module|Stripping types is currently unsupported/i.test(message),
    `Unexpected import error: ${message}`,
  );

  return "PASS: importing `crewai` fails because published entrypoint is not executable JS";
};
