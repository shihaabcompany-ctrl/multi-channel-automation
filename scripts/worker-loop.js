/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("child_process");

const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 30000);

function runWorkerOnce() {
  console.log(`[worker-loop] Checking due automations at ${new Date().toISOString()}`);

  const child = spawn(
    process.execPath,
    ["--env-file=.env.local", "scripts/run-due-automations.js"],
    {
      stdio: "inherit",
      shell: false,
    }
  );

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[worker-loop] Worker exited with code ${code}`);
    }
  });
}

runWorkerOnce();
setInterval(runWorkerOnce, intervalMs);
