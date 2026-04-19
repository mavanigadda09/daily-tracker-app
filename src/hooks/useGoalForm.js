import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Manages goal form as local draft state.
 * Only syncs to parent (Firebase) after a Save action or 1s debounce.
 *
 * This prevents a Firestore write on every keystroke.
 */
export function useGoalForm(weightGoal, setWeightGoal) {
  const empty = {
    startWeight: "",
    targetWeight: "",
    startDate: "",
    endDate: "",
  };

  const [draft, setDraft] = useState(weightGoal || empty);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const saveTimerRef = useRef(null);

  // Sync external changes into draft (e.g. loaded from Firestore)
  // but don't overwrite unsaved local edits
  useEffect(() => {
    if (!isDirty && weightGoal) {
      setDraft(weightGoal);
    }
  }, [weightGoal, isDirty]);

  const setField = useCallback((field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, [field]: null })); // Clear field error on edit
  }, []);

  const validate = useCallback((d) => {
    const errs = {};
    const start = Number(d.startWeight);
    const target = Number(d.targetWeight);

    if (!d.startWeight || isNaN(start) || start <= 0)
      errs.startWeight = "Enter a valid start weight";
    if (!d.targetWeight || isNaN(target) || target <= 0)
      errs.targetWeight = "Enter a valid target weight";
    if (start > 0 && target > 0 && start === target)
      errs.targetWeight = "Target must differ from start weight";
    if (d.endDate && d.startDate && d.endDate <= d.startDate)
      errs.endDate = "End date must be after start date";

    return errs;
  }, []);

  const save = useCallback(() => {
    const errs = validate(draft);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }

    // Coerce to numbers only on save — not on every keystroke
    setWeightGoal({
      ...draft,
      startWeight: Number(draft.startWeight),
      targetWeight: Number(draft.targetWeight),
    });

    setIsDirty(false);
    setErrors({});
    return true;
  }, [draft, validate, setWeightGoal]);

  const reset = useCallback(() => {
    setDraft(weightGoal || empty);
    setIsDirty(false);
    setErrors({});
  }, [weightGoal]);

  // Cleanup debounce timer on unmount
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  return { draft, setField, save, reset, isDirty, errors };
}