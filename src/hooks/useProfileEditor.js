// src/hooks/useProfileEditor.js
import { useState, useEffect, useCallback } from "react";

/**
 * Encapsulates all Profile edit logic.
 * UI owns zero business logic — it only calls these handlers.
 *
 * @param {object} user - Current user object from useAppData/useAuth
 * @param {function} updateUser - Firestore write fn from useAppData
 */
export function useProfileEditor(user, updateUser) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState("productivity");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync local draft state when user loads or changes
  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setGoal(user.goal || "");
    setFocus(user.focus || "productivity");
  }, [user]);

  const handleEdit = useCallback(() => {
    setSaveError(null);
    setSaveSuccess(false);
    setEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    // Revert draft to current persisted values
    if (user) {
      setName(user.name || "");
      setGoal(user.goal || "");
      setFocus(user.focus || "productivity");
    }
    setEditing(false);
    setSaveError(null);
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // updateUser is your Firestore write — comes from useAppData
      // This keeps DataContext as the single source of truth.
      // No localStorage write — Firebase IS the persistence layer.
      await updateUser({
        name: trimmedName,
        goal: goal.trim(),
        focus,
      });

      setSaveSuccess(true);
      setEditing(false);

      // Clear success message after 3s
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("[Profile] Save failed:", err);
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [user, name, goal, focus, updateUser]);

  /**
   * Hard reset: signs the user out first, then clears local state.
   * Does NOT just clear localStorage — that's incomplete with Firebase Auth.
   * The actual Firestore data reset should be a separate explicit flow
   * (or an admin function), not a one-tap nuke from the profile page.
   */
  const handleReset = useCallback(async (onLogout) => {
    const confirmed = window.confirm(
      "This will sign you out and clear all local app data.\n\n" +
      "Your cloud data is preserved. Continue?"
    );
    if (!confirmed) return;

    try {
      // Clear local cache only — Firebase data stays intact
      localStorage.clear();
      sessionStorage.clear();
      // Delegate to auth signOut — let useAuth handle cleanup
      if (onLogout) await onLogout();
    } catch (err) {
      console.error("[Profile] Reset failed:", err);
    }
  }, []);

  return {
    // State
    editing,
    name,
    goal,
    focus,
    isSaving,
    saveError,
    saveSuccess,
    // Setters (for controlled inputs)
    setName,
    setGoal,
    setFocus,
    // Handlers
    handleEdit,
    handleCancel,
    handleSave,
    handleReset,
  };
}