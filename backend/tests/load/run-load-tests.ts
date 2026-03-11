import autocannon from "autocannon";

const BASE_URL = process.env.LOAD_BASE_URL || "http://localhost:4000";
const API_BASE = `${BASE_URL}/api`;
const TOKEN = process.env.LOAD_BEARER_TOKEN || "";

type Scenario = {
  name: string;
  path: string;
  useApiBase?: boolean;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  duration: number;
  connections: number;
  amount: number;
};

const scenarios: Scenario[] = [
  { name: "health-check", path: "/health", useApiBase: false, duration: 15, connections: 20, amount: 5000 },
  { name: "dashboard", path: "/dashboard/stats", duration: 20, connections: 50, amount: 20000 },
  { name: "history", path: "/history?page=1&limit=50&period=month", duration: 20, connections: 40, amount: 15000 },
  { name: "inventory", path: "/inventory?page=1", duration: 20, connections: 40, amount: 15000 },
  { name: "purchases-list", path: "/purchases?limit=50&offset=0", duration: 20, connections: 35, amount: 12000 },
];

function runScenario(s: Scenario): Promise<void> {
  return new Promise((resolve, reject) => {
    const root = s.useApiBase === false ? BASE_URL : API_BASE;
    const url = `${root}${s.path}`;
    const instance = autocannon(
      {
        url,
        method: s.method || "GET",
        connections: s.connections,
        duration: s.duration,
        amount: s.amount,
        headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
        body: s.body ? JSON.stringify(s.body) : undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        const p99 = result.latency.p99;
        const avg = result.latency.average;
        const errors = result.errors;
        const timeouts = result.timeouts;
        console.log(
          `[load] ${s.name} done | reqs=${result.requests.total} | p99=${p99}ms | avg=${avg}ms | errors=${errors} | timeouts=${timeouts}`
        );
        resolve();
      }
    );
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  console.log(`[load] Running ${scenarios.length} scenarios against ${API_BASE}`);
  if (!TOKEN) {
    console.log("[load] No LOAD_BEARER_TOKEN provided. Public/unauthorized endpoints may return 401.");
  }
  for (const s of scenarios) {
    await runScenario(s);
  }
  console.log("[load] Completed all scenarios.");
}

main().catch((e) => {
  console.error("[load] Failed:", e);
  process.exit(1);
});

