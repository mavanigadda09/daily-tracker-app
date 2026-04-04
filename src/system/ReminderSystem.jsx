import { useEffect } from "react";
import { useNotification } from "../context/NotificationContext";

export default function ReminderSystem({
  items = [],
  tasks = [],
  logs = {}
}) {
  const { showNotification } = useNotification();

  useEffect(() => {
    const checkSmartReminders = () => {
      const today = new Date().toDateString();

      // ===== HABITS CHECK =====
      const incompleteHabits = items.filter(item => {
        if (item.type !== "habit") return false;

        return !item.completed?.[today];
      });

      if (incompleteHabits.length > 0) {
        showNotification(
          `⚠️ You have ${incompleteHabits.length} habits pending today`,
          "error"
        );
      }

      // ===== TASKS CHECK =====
      const pendingTasks = tasks.filter(t => !t.done);

      if (pendingTasks.length > 0) {
        showNotification(
          `📌 ${pendingTasks.length} tasks still pending`,
          "info"
        );
      }

      // ===== EVENING PUSH =====
      const hour = new Date().getHours();

      if (hour === 20) {
        showNotification(
          "🌙 Review your day and complete remaining goals",
          "info"
        );
      }
    };

    const interval = setInterval(checkSmartReminders, 60000);

    return () => clearInterval(interval);
  }, [items, tasks, logs]);

  return null;
}