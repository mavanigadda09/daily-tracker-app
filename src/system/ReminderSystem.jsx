import { useEffect, useRef } from "react";
import { useNotification } from "../context/NotificationContext";

export default function ReminderSystem({
  items = [],
  tasks = []
}) {
  const { showNotification } = useNotification();

  const lastNotified = useRef({
    habits: null,
    tasks: null,
    evening: null
  });

  useEffect(() => {
    const checkSmartReminders = () => {
      const now = new Date();
      const today = now.toDateString();
      const hour = now.getHours();

      // ===== HABITS CHECK =====
      const incompleteHabits = items.filter(item => {
        if (item.type !== "habit") return false;
        return !item.completed?.[today];
      });

      if (
        incompleteHabits.length > 0 &&
        lastNotified.current.habits !== today
      ) {
        showNotification(
          `⚠️ You have ${incompleteHabits.length} habits pending today`,
          "error"
        );

        lastNotified.current.habits = today;
      }

      // ===== TASKS CHECK =====
      const pendingTasks = tasks.filter(t => !t.done);

      if (
        pendingTasks.length > 0 &&
        lastNotified.current.tasks !== today
      ) {
        showNotification(
          `📌 ${pendingTasks.length} tasks still pending`,
          "info"
        );

        lastNotified.current.tasks = today;
      }

      // ===== EVENING PUSH (once per day) =====
      if (hour === 20 && lastNotified.current.evening !== today) {
        showNotification(
          "🌙 Review your day and complete remaining goals",
          "info"
        );

        lastNotified.current.evening = today;
      }
    };

    const interval = setInterval(checkSmartReminders, 60000);

    // Run once immediately (better UX)
    checkSmartReminders();

    return () => clearInterval(interval);
  }, [items, tasks, showNotification]);

  return null;
}