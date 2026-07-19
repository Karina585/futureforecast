import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}

/**
 * A number input that tracks its own display text so clearing the field (or
 * typing over a value) doesn't leave a stuck leading zero — e.g. clearing
 * "50000" and typing "5" would otherwise render "05" and go on to become
 * "050000" as more digits are typed after it.
 */
export function NumberField({ value, onChange, min, step }: Props) {
  const [text, setText] = useState(String(value));
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    // Only re-sync from the external value if it doesn't match what's
    // currently typed, so this doesn't clobber in-progress typing (e.g. a
    // trailing "." or a temporarily-empty field) on every keystroke.
    const parsed = textRef.current === "" || textRef.current === "-" ? 0 : Number(textRef.current);
    if (parsed !== value) {
      setText(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (/^0+[0-9]/.test(raw)) raw = raw.replace(/^0+/, "");
    setText(raw);
    const parsed = raw === "" || raw === "-" ? 0 : Number(raw);
    if (!Number.isNaN(parsed)) onChange(parsed);
  };

  return (
    <input type="number" min={min} step={step} value={text} onChange={handleChange} />
  );
}
