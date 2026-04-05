import { useEffect, useRef } from "react";
import { useNotification } from "../context/NotificationContext";

export default function HabitReminderSystem({ items = [] }) {
  const { showNotification } = useNotification();

  // 🧠 Prevent spam
  const lastReminderRef = useRef(0);
  const lastEveningRef = useRef(null);

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
    // 🔔 Request browser permission once
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkHabits = () => {
      const now = Date.now();

      // ⏱️ Prevent spam (5 min cooldown)
      if (now - lastReminderRef.current < 5 * 60 * 1000) return;

      const today = getKey(new Date());
      const hour = new Date().getHours();

      const habits = items.filter(i => i.type === "habit");

      const incomplete = habits.filter(
        h => !h.completed?.[today]
      );

      // ===== BASIC REMINDER =====
      if (incomplete.length > 0) {
        lastReminderRef.current = now;

        const message = `⚠️ ${incomplete.length} habits pending today`;

        showNotification(message, "error");

        // 🔔 Browser notification
        if (Notification.permission === "granted") {
          new Notification("Habits Reminder", {
            body: message
          });
        }
      }

      // ===== EVENING REMINDER (ONCE PER DAY) =====
      const todayStr = new Date().toDateString();

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

      // ===== STREAK RISK ALERT =====
      const atRisk = habits.filter((h) => {
        const streak = getStreak(h);
        return streak >= 3 && !h.completed?.[today];
      });

      if (atRisk.length > 0) {
        const message = `🔥 ${atRisk.length} habit streak(s) at risk!`;

        showNotification(message, "error");

        if (Notification.permission === "granted") {
          new Notification("Streak Alert", {
            body: message
          });
        }
      }
    };

    const interval = setInterval(checkHabits, 60000);

    return () => clearInterval(interval);

  }, [items]);

  return null;
}