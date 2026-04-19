import { useState, useCallback } from "react";

// Locked enum — prevents category data pollution
export const CATEGORIES = [
  "Food", "Travel", "Shopping", "Health", "Bills", "Other"
];

const INITIAL_STATE = {
  amount: "",
  type: "expense",
  category: "Other",
  note: "",
};

/**
 * Manages Finance entry form: state, validation, submit lifecycle.
 * Keeps Finance.jsx free of imperative form logic.
 *
 * @param {Function} onSubmit - async fn receiving { amount, type, category, note }
 * @param {Function} notify   - from useNotification / NotificationContext
 */
export function useFinanceForm(onSubmit, notify) {
  const [fields, setFields] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setFields(INITIAL_STATE), []);

  const handleSubmit = useCallback(async () => {
    const numAmount = Number(fields.amount);

    // Validation — uses notify instead of alert()
    if (!numAmount || numAmount <= 0) {
      notify?.({ type: "error", message: "Enter a valid amount greater than 0" });
      return;
    }

    if (isSubmitting) return; // Hard guard against double-fire

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: numAmount,
        type: fields.type,
        category: fields.category,
        note: fields.note.trim(),
      });
      reset();
    } catch (err) {
      // Surface Firebase / network errors — don't silently swallow
      notify?.({
        type: "error",
        message: err?.message ?? "Failed to add transaction. Try again.",
      });
    } finally {
      // Always unblock the button — even on error
      setIsSubmitting(false);
    }
  }, [fields, isSubmitting, onSubmit, notify, reset]);

  return { fields, setField, handleSubmit, isSubmitting, reset };
}