import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Analytics({ logs }) {

  // 🔥 GROUP BY DATE
  const daily = {};

  Object.values(logs).forEach((activityLogs) => {
    activityLogs.forEach((l) => {
      if (!daily[l.date]) daily[l.date] = 0;
      daily[l.date] += l.value;
    });
  });

  const chartData = Object.keys(daily).map((date) => ({
    date,
    value: daily[date]
  }));

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>📊 Daily Progress</h1>

      <div style={styles.card}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16
  }
};