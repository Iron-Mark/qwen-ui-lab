"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "../clipboard.client";

export type CopyStatus = "idle" | "copying" | "success" | "error";

const SUCCESS_MS = 2000;
const ERROR_MS = 3500;

export function useCopyToClipboard(resetMs = SUCCESS_MS) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const copy = useCallback(
    async (text: string, successMessage = "Copied to clipboard") => {
      clearTimer();
      setStatus("copying");
      setMessage("Copying…");

      const result = await copyTextToClipboard(text);
      if (result.ok) {
        setStatus("success");
        setMessage(successMessage);
        timerRef.current = setTimeout(() => {
          setStatus("idle");
          setMessage(null);
        }, resetMs);
      } else {
        setStatus("error");
        setMessage(result.error || "Copy failed. Try again.");
        timerRef.current = setTimeout(() => {
          setStatus("idle");
          setMessage(null);
        }, ERROR_MS);
      }
      return result;
    },
    [clearTimer, resetMs],
  );

  return { status, message, copy, isCopying: status === "copying" };
}
