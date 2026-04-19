// src/hooks/useSetupForm.js
import { useState, useCallback } from "react";

/**
 * Encapsulates all Setup form logic.
 * addActivity comes from useAppData — this hook is UI-agnostic.
 */

const SUGGESTED = [
  { name: "Water",      unit: "L",     target: 5   },
  { name: "Workout",    unit: "min",   target: 45  },
  { name: "Reading",    unit: "pages", target: 20  },
  { name: "Meditation", unit: "min",   target: 15  },
];

const UNITS = [
  { value: "L",     label: "Liters"   },
  { value: "min",   label: "Minutes"  },
  { value: "pages", label: "Pages"    },
  { value: "reps",  label: "Reps"     },
  { value: "km",    label: "Km"       },
];

const FREQUENCIES = [
  { value: "daily",    label: "Daily"    },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly",   label: "Weekly"   },
];

const EMPTY_FORM = {
  name: "", target: "", unit: "L", time: "", freq: "daily",
};

export function useSetupForm(activities, addActivity) {
  const [form, setForm]   = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  // Autofill unit+target when user picks a suggestion
  const applySuggestion = useCallback((name) => {
    const match = SUGGESTED.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (match) {
      setForm((prev) => ({
        ...prev,
        name: match.name,
        unit: match.unit,
        target: String(match.target),
      }));
    } else {
      set("name", name);
    }
    setError("");
  }, [set]);

  const isValid =
    form.name.trim().length > 0 && Number(form.target) > 0;

  const handleSave = useCallback(() => {
    if (!isValid) {
      setError("Enter a valid name and target.");
      return;
    }

    const duplicate = activities.some(
      (a) => a.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (duplicate) {
      setError("An activity with this name already exists.");
      return;
    }

    addActivity({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      target: Number(form.target),
      unit: form.unit,
      reminderTime: form.time,
      frequency: form.freq,
    });

    setForm(EMPTY_FORM);
    setError("");
  }, [form, isValid, activities, addActivity]);

  return {
    form, set,
    applySuggestion,
    isValid, error,
    handleSave,
    SUGGESTED, UNITS, FREQUENCIES,
  };
}