const targets = [
  {
    name: "React Demo",
    url: process.env.SMOKE_REACT_URL || "http://127.0.0.1:5173/",
    requiredSnippets: [
      "C1X Workflow Builder - React Demo",
      "Workflow Canvas",
      "JSON Output",
      "Node Types",
    ],
  },
  {
    name: "Angular Demo",
    url: process.env.SMOKE_ANGULAR_URL || "http://127.0.0.1:4200/",
    requiredSnippets: [
      "C1X Workflow Builder - Angular Demo",
      "Workflow Canvas",
      "JSON Output",
      "Node Types",
    ],
  },
  {
    name: "Standalone Demo",
    url:
      process.env.SMOKE_STANDALONE_URL ||
      "http://127.0.0.1:4173/demo/index.html",
    requiredSnippets: [
      "Workflow Engine Demo",
      "Framework-agnostic",
      "JSON Output",
      "Workflow Canvas",
    ],
  },
];

async function checkTarget(target) {
  const response = await fetch(target.url);
  if (!response.ok) {
    throw new Error(
      `${target.name} returned HTTP ${response.status} at ${target.url}`,
    );
  }

  const html = await response.text();
  const missing = target.requiredSnippets.filter(
    (snippet) => !html.includes(snippet),
  );
  if (missing.length > 0) {
    throw new Error(
      `${target.name} is reachable but missing expected content: ${missing.join(", ")}`,
    );
  }

  return `${target.name}: OK (${target.url})`;
}

(async () => {
  const failures = [];

  for (const target of targets) {
    try {
      const result = await checkTarget(target);
      console.log(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error(`${target.name}: FAIL - ${message}`);
    }
  }

  if (failures.length > 0) {
    console.error(
      "\nSmoke check failed. Ensure demo servers are running before retrying.",
    );
    process.exit(1);
  }

  console.log("\nAll app smoke checks passed.");
})();
