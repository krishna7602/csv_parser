"use client";

import { useRef } from "react";

interface FilePickerButtonProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  label?: string;
}

export function FilePickerButton({
  onFile,
  disabled,
  label = "Browse Files",
}: FilePickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        id="file-picker-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
        disabled={disabled}
      />
      <button
        id="file-picker-btn"
        className="btn-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        type="button"
      >
        📁 {label}
      </button>
    </>
  );
}
