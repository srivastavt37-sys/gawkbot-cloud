import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { setupOpenCodeAuth, startOpenCodeGateway, createLoopbackReverseProxy } from "./opencode-gateway.mjs";

const homeDir = "/var/tmp/gawkhome";
const wuphfDir = path.join(homeDir, ".wuphf-spaces", "main", ".wuphf");
fs.mkdirSync(wuphfDir, { recursive: true });
setupOpenCodeAuth(homeDir);
startOpenCodeGateway(6446);

fs.writeFileSync(
  path.join(wuphfDir, "config.json"),
  JSON.stringify({
    llm_provider: "opencode",
    llm_provider_priority: ["opencode"],
    memory_backend: "none"
  }, null, 2)
);

createLoopbackReverseProxy({
  appSlug: "gawkbot-cloud",
  appTitle: "Gawkbot Cloud Office",
  publicUrl: process.env.RENDER_EXTERNAL_URL || "https://gawkbot-cloud.onrender.com",
  targetPort: 7891,
  stripForwarded: true
});

function launchGawkbot() {
  const child = spawn("/usr/local/bin/gawkbot", ["--no-open", "--provider", "opencode", "--memory-backend", "none", "--unsafe", "--web-port", "7891"], {
    cwd: homeDir,
    stdio: ["ignore", "inherit", "inherit"],
    env: {
      ...process.env,
      HOME: homeDir,
      WUPHF_RUNTIME_HOME: path.join(homeDir, ".wuphf-spaces", "main"),
      WUPHF_LLM_PROVIDER: "opencode",
      WUPHF_OPENCODE_MODEL: "opencode/crouton-alpha-free",
      OPENCODE_MODEL: "opencode/crouton-alpha-free",
      WUPHF_WIKI_BACKEND: "memory",
      WUPHF_MEMORY_BACKEND: "none"
    }
  });
  child.on("exit", (code) => {
    console.error("[Gawkbot] exited with code", code, "- restarting in 2s...");
    setTimeout(launchGawkbot, 2000);
  });
}
launchGawkbot();
