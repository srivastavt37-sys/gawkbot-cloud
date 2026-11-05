import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { setupOpenCodeAuth, startOpenCodeGateway, createLoopbackReverseProxy } from "./opencode-gateway.mjs";

const homeDir = process.env.HOME || "/data";
const wuphfDir = path.join(homeDir, ".wuphf");
fs.mkdirSync(wuphfDir, { recursive: true });
setupOpenCodeAuth(homeDir);
startOpenCodeGateway(6446);

fs.writeFileSync(
  path.join(wuphfDir, "config.json"),
  JSON.stringify({
    llm_provider: "opencode",
    llm_provider_priority: ["opencode"],
    memory_backend: "markdown"
  }, null, 2)
);

createLoopbackReverseProxy({
  appSlug: "gawkbot-cloud",
  appTitle: "Gawkbot Cloud Office",
  publicUrl: process.env.RENDER_EXTERNAL_URL || "https://gawkbot-cloud.onrender.com",
  targetPort: 7891,
  stripForwarded: true
});

const child = spawn("/usr/local/bin/gawkbot", ["--no-open", "--provider", "opencode", "--unsafe", "--web-port", "7891"], {
  cwd: homeDir,
  stdio: ["ignore", "inherit", "inherit"],
  env: {
    ...process.env,
    HOME: homeDir,
    WUPHF_RUNTIME_HOME: homeDir,
    WUPHF_LLM_PROVIDER: "opencode",
    WUPHF_OPENCODE_MODEL: "opencode/crouton-alpha-free",
    OPENCODE_MODEL: "opencode/crouton-alpha-free",
    WUPHF_WIKI_BACKEND: "memory"
  }
});

// Auto-complete onboarding so the Slack-like multi-bot office is ready immediately
setTimeout(() => {
  const payload = JSON.stringify({
    task: "Coordinate engineering, product, and research tasks with OpenCode crouton-alpha-free",
    skip_task: true,
    blueprint: "ai-startup",
    company_name: "OpenCode AI Office"
  });
  const req = http.request({
    hostname: "127.0.0.1",
    port: 7891,
    path: "/onboarding/complete",
    method: "POST",
    headers: {
      "Host": "127.0.0.1:7891",
      "Origin": "http://127.0.0.1:7891",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  }, (res) => {
    res.resume();
    console.log("[Gawkbot] Onboarding seeded, status:", res.statusCode);
  });
  req.on("error", () => {});
  req.write(payload);
  req.end();
}, 4500);
