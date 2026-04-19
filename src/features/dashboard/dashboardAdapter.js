/**
 * dashboardAdapter.js
 * Transforms raw app data → dashboard-friendly structure
 */

export default function mapToDashboardData({ tasks = [], items = [], weightLogs = [] }) {
  // 🔹 Basic safety
  const safeTasks = tasks || [];
  const safeItems = items || [];
  const safeLogs  = weightLogs || [];

  // 🔹 Example transformations (you can expand later)
  const completedTasks = safeTasks.filter((t) => t.completed);
  const pendingTasks   = safeTasks.filter((t) => !t.completed);

  const latestWeight =
    safeLogs.length > 0 ? safeLogs[safeLogs.length - 1].value || null : null;

  // 🔹 Return structured dashboard data
  return {
    tasks: safeTasks,
    items: safeItems,
    weightLogs: safeLogs,

    stats: {
      totalTasks: safeTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      totalItems: safeItems.length,
      latestWeight,
    },
  };
}