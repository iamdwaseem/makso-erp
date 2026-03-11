import { DashboardMetricsService } from "../services/dashboardMetrics.service.js";
import { getEnv } from "../config/env.js";

/**
 * Starts a background periodic worker to refresh dashboard analytics.
 * This ensures the DashboardMetrics table remains semi-fresh while
 * keeping CPU-intensive aggregations away from the user request path.
 */
export function startMetricsWorker(intervalMs: number = 60000) {
    const service = new DashboardMetricsService();
    const env = getEnv();
    
    // Initial population on startup
    service.refreshAllMetrics();
    
    // Repeated execution
    const interval = setInterval(() => {
        service.refreshAllMetrics();
    }, intervalMs);
    
    // Allow graceful termination
    process.on('SIGTERM', () => clearInterval(interval));
    process.on('SIGINT', () => clearInterval(interval));
    
    if (env.HTTP_LOGS === "true") {
        console.log(`[Worker] Dashboard metrics background job active (Interval: ${intervalMs}ms)`);
    }
}
