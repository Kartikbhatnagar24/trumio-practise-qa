import { useRef, useState } from "react";

import { UploadIcon } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import { Receipt } from "@/constraints/types/claim-types";
import { cn } from "@/lib/utils";

interface ReceiptDropzoneProps {
  file: File | null;
  saved: Receipt | null;
  error?: string;
  required: boolean;
  onFile: (file: File | null) => void;
}

const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export function ReceiptDropzone({ file, saved, error, required, onFile }: ReceiptDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const name = file?.name ?? saved?.filename;
  const size = file?.size ?? saved?.size;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span id="receipt-label" className="font-medium">
          Receipt
        </span>
        <span className="text-xs text-secondary">{required ? "Needed for this amount" : "Optional for this amount"}</span>
      </div>
      <div
        role="group"
        aria-labelledby="receipt-label"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          onFile(event.dataTransfer.files[0] ?? null);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-[var(--radius-panel)] border border-dashed border-field bg-sheet-soft px-6 py-8 text-center",
          dragging && "border-brand bg-brand-wash",
          error && "border-danger",
        )}
      >
        <UploadIcon className="text-secondary" />
        {name ? (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-[13px] text-secondary">{size ? `${Math.ceil(size / 1024)} KB` : ""}{file ? ", uploads when you save" : ", uploaded"}</div>
          </div>
        ) : (
          <div className="text-secondary">Drop the itemised bill here, or choose a file. PDF, JPG or PNG up to 5 MB.</div>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            {name ? "Replace file" : "Choose file"}
          </Button>
          {file && (
            <Button variant="ghost" size="sm" onClick={() => onFile(null)}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          id="receipt-file"
          type="file"
          accept={ACCEPT}
          aria-label="Receipt file"
          className="sr-only"
          onChange={(event) => {
            onFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </div>
      {error && <span className="text-[13px] leading-[18px] text-danger">{error}</span>}
    </div>
  );
}
