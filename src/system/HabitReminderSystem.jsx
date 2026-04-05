import { useEffect, useRef } from "react";
import { useNotification } from "../context/NotificationContext";

export default function HabitReminderSystem({ items = [] }) {
  const { showNotification } = useNotification();

  // 🧠 Prevent spam
  const lastReminderRef = useRef(0);
  const lastEveningRef = useRef(null);
  const triggeredRef = useRef({}); // ⏰ track per-habit triggers

  // ===== HELPERS =====
  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const getStreak = (habit) => {
    const completed = habit.completed || {};
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getKey(d);

      if (completed[key]) streak++;
      else break;
    }

    return streak;
  };

  useEffect(() => {
    // 🔔 Request permission once
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkHabits = () => {
      const now = new Date();
      const nowTime = now.getTime();

      const todayKey = getKey(now);
      const hour = now.getHours();

      const habits = items.filter(i => i.type === "habit");

      const incomplete = habits.filter(
        h => !h.completed?.[todayKey]
      );

      // =========================
      // 🔥 BASIC REMINDER (cooldown)
      // =========================
      if (nowTime - lastReminderRef.current > 5 * 60 * 1000) {
        if (incomplete.length > 0) {
          lastReminderRef.current = nowTime;

          const message = `⚠️ ${incomplete.length} habits pending today`;

          showNotification(message, "error");

          if (Notification.permission === "granted") {
            new Notification("Habits Reminder", { body: message });
          }
        }
      }

      // =========================
      // 🌙 EVENING REMINDER
      // =========================
      const todayStr = now.toDateString();

      if (
        hour === 20 &&
        lastEveningRef.current !== todayStr &&
        incomplete.length > 0
      ) {
        lastEveningRef.current = todayStr;

        const message = "🌙 Final call! Complete your habits today";

        showNotification(message, "info");

        if (Notification.permission === "granted") {
          new Notification("Evening Habit Reminder", {
            body: message
          });
        }
      }

      // =========================
      // 🔥 STREAK RISK ALERT
      // =========================
      const atRisk = habits.filter((h) => {
        const streak = getStreak(h);
        return streak >= 3 && !h.completed?.[todayKey];
      });

      if (atRisk.length > 0) {
        const message = `🔥 ${atRisk.length} habit streak(s) at risk!`;

        showNotification(message, "error");

        if (Notification.permission === "granted") {
          new Notification("Streak Alert", { body: message });
        }
      }

      // =========================
      // ⏰ TIME-BASED REMINDERS
      // =========================
      habits.forEach((habit) => {
        if (!habit.time) return;

        const [h, m] = habit.time.split(":");

        const habitTime = new Date();
        habitTime.setHours(Number(h));
        habitTime.setMinutes(Number(m));
        habitTime.setSeconds(0);

        const idKey = `${habit.id}-${todayKey}`;

        const alreadyDone = habit.completed?.[todayKey];

        const diff = Math.abs(now - habitTime);

        // ⏰ EXACT TIME TRIGGER
        if (
          diff < 60000 &&
          !alreadyDone &&
          !triggeredRef.current[idKey]
        ) {
          triggeredRef.current[idKey] = true;

          const message = `⏰ ${habit.name} time!`;

          showNotification(message, "info");

          if (Notification.permission === "granted") {
            new Notification("Habit Reminder", {
              body: message
            });
          }
        }

        // ⚠️ MISSED ALERT (30 min later)
        const lateTime = new Date(habitTime.getTime() + 30 * 60000);

        if (
          now > lateTime &&
          !alreadyDone &&
          !triggeredRef.current[idKey + "-late"]
        ) {
          triggeredRef.current[idKey + "-late"] = true;

          const message = `⚠️ You missed: ${habit.name}`;

          showNotification(message, "error");

          if (Notification.permission === "granted") {
            new Notification("Missed Habit", {
              body: message
            });
          }
        }
      });
    };

    const interval = setInterval(checkHabits, 30000);

    return () => clearInterval(interval);

  }, [items]);

  return null;
}