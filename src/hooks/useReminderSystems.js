/**
 * useReminderSystems.js
 * ─────────────────────────────────────────────────────────────
 * Reminder systems are pure side effects — they render nothing.
 * Encoding them as JSX components leaks implementation detail into
 * the render tree and forces unnecessary reconciliation passes.
 *
 * This hook runs both systems' logic directly, keeping the tree clean.
 * Drop-in replacement: delete <ReminderSystem> and <HabitReminderSystem>
 * from JSX and call this hook instead.
 *
 * If ReminderSystem / HabitReminderSystem are third-party or too large
 * to inline immediately, this adapter pattern still removes them from
 * the render tree by rendering them into a detached React root.
 */
import { useEffect, useRef } from "react";
import { createRoot }        from "react-dom/client";
import ReminderSystem        from "../system/ReminderSystem";
import HabitReminderSystem   from "../system/HabitReminderSystem";
import { createElement }     from "react";

export function useReminderSystems({ items, tasks, logs }) {
  const containerRef = useRef(null);
  const rootRef      = useRef(null);

  // Create a detached DOM node once — never appended to the document,
  // so it never affects layout or paint.
  useEffect(() => {
    containerRef.current = document.createElement("div");
    rootRef.current      = createRoot(containerRef.current);

    return () => {
      rootRef.current.unmount();
    };
  }, []);

  // Re-render both systems whenever their inputs change.
  useEffect(() => {
    rootRef.current?.render(
      createElement(
        "div",
        null,
        createElement(ReminderSystem,      { items, tasks, logs }),
        createElement(HabitReminderSystem, { items })
      )
    );
  }, [items, tasks, logs]);
}
