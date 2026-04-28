export function mapToDashboardData({ tasks, items, weightLogs }) {
  return {
    tasks: tasks || [],

    // items = habits in your system
    items: (items || []).map((item) => ({
      ...item,
      type: "habit",
      lastCompleted: item.lastCompleted || item.completedAt || null,
    })),

    weightLogs: weightLogs || [],
  };
}

export default mapToDashboardData;