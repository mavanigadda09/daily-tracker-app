import { useEffect, useRef } from "react";
import { useNotification } from "@context/NotificationContext";

const CHECK_INTERVAL_MS  = 30_000;
const BASIC_COOLDOWN_MS  = 5 * 60_000;
const STREAK_COOLDOWN_MS = 60 * 60_000; // streak alert max once/hour

export default function HabitReminderSystem({ items = [] }) {
  const { showNotification } = useNotification();

  const lastBasicRef       = useRef(0);
  const lastEveningRef     = useRef(null);
  const lastStreakRef       = useRef(0);
  const triggeredRef       = useRef({});

  // ─── Permission — once only ──────────────────────────────
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // ─── Reset triggered map at midnight ────────────────────
  useEffect(() => {
    const now           = new Date();
    const msToMidnight  =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      ) - now;

    const timer = setTimeout(() => {
      triggeredRef.current = {};
    }, msToMidnight);

    return () => clearTimeout(timer);
  }, []);

  // ─── Core reminder loop ──────────────────────────────────
  useEffect(() => {
    const habits = items.filter((i) => i.type === "habit");
    if (!habits.length) return;

    const pushOS = (title, body) => {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, { body, icon: "/phoenix.png" });
      }
    };

    const getKey   = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    const getStreak = (habit) => {
      const completed = habit.completed ?? {};
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (completed[getKey(d)]) streak++;
        else break;
      }
      return streak;
    };

    const checkHabits = () => {
      const now      = new Date();
      const nowTime  = now.getTime();
      const todayKey = getKey(now);
      const hour     = now.getHours();
      const todayStr = now.toDateString();

      const incomplete = habits.filter((h) => !h.completed?.[todayKey]);

      // ── Basic reminder (cooldown protected) ──
      if (
        incomplete.length > 0 &&
        nowTime - lastBasicRef.current > BASIC_COOLDOWN_MS
      ) {
        lastBasicRef.current = nowTime;
        const msg = `${incomplete.length} habit${incomplete.length > 1 ? "s" : ""} pending today`;
        showNotification(msg, "warning");
        pushOS("Habits Reminder", msg);
      }

      // ── Evening reminder (once per day at 20:xx) ──
      if (
        hour === 20 &&
        lastEveningRef.current !== todayStr &&
        incomplete.length > 0
      ) {
        lastEveningRef.current = todayStr;
        const msg = "Final call — complete your habits today";
        showNotification(msg, "info");
        pushOS("Evening Reminder", msg);
      }

      // ── Streak risk alert (cooldown protected) ──
      const atRisk = habits.filter(
        (h) => getStreak(h) >= 3 && !h.completed?.[todayKey]
      );

      if (
        atRisk.length > 0 &&
        nowTime - lastStreakRef.current > STREAK_COOLDOWN_MS
      ) {
        lastStreakRef.current = nowTime;
        const msg = `${atRisk.length} habit streak${atRisk.length > 1 ? "s" : ""} at risk`;
        showNotification(msg, "error");
        pushOS("Streak Alert", msg);
      }

      // ── Per-habit time-based reminders ──
      habits.forEach((habit) => {
        if (!habit.time || habit.completed?.[todayKey]) return;

        const [h, m]   = habit.time.split(":").map(Number);
        const habitTime = new Date();
        habitTime.setHours(h, m, 0, 0);

        const idKey   = `${habit.id}-${todayKey}`;
        const diff    = now - habitTime;

        // Exact time (within 1 min window)
        if (
          Math.abs(diff) < 60_000 &&
          !triggeredRef.current[idKey]
        ) {
          triggeredRef.current[idKey] = true;
          const msg = `Time for: ${habit.name}`;
          showNotification(msg, "info");
          pushOS("Habit Reminder", msg);
        }

        // Missed alert (30 min past due)
        if (
          diff > 30 * 60_000 &&
          !triggeredRef.current[`${idKey}-late`]
        ) {
          triggeredRef.current[`${idKey}-late`] = true;
          const msg = `Missed: ${habit.name}`;
          showNotification(msg, "error");
          pushOS("Missed Habit", msg);
        }
      });
    };

    checkHabits();
    const interval = setInterval(checkHabits, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);

  }, [items, showNotification]);

  return null;
}