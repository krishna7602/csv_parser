"use client";

import { useReducer, useCallback } from "react";
import type { ImportResult } from "@groweasy/shared";

// ─── State Machine Types ───────────────────────────────────────────────────────

export type FlowStep =
  | "idle"
  | "uploading"
  | "previewing"
  | "importing"
  | "done"
  | "error";

export interface FlowState {
  step: FlowStep;
  file: File | null;
  uploadId: string | null;
  headers: string[];
  preview: Record<string, string>[];
  rowCount: number;
  result: ImportResult | null;
  error: string | null;
}

type FlowAction =
  | { type: "START_UPLOAD"; file: File }
  | {
      type: "UPLOAD_SUCCESS";
      uploadId: string;
      headers: string[];
      preview: Record<string, string>[];
      rowCount: number;
    }
  | { type: "UPLOAD_ERROR"; error: string }
  | { type: "START_IMPORT" }
  | { type: "IMPORT_SUCCESS"; result: ImportResult }
  | { type: "IMPORT_ERROR"; error: string }
  | { type: "RESET" }
  | { type: "RETRY_UPLOAD" }
  | { type: "RETRY_IMPORT" };

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: FlowState = {
  step: "idle",
  file: null,
  uploadId: null,
  headers: [],
  preview: [],
  rowCount: 0,
  result: null,
  error: null,
};

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "START_UPLOAD":
      return {
        ...initialState,
        step: "uploading",
        file: action.file,
      };

    case "UPLOAD_SUCCESS":
      return {
        ...state,
        step: "previewing",
        uploadId: action.uploadId,
        headers: action.headers,
        preview: action.preview,
        rowCount: action.rowCount,
        error: null,
      };

    case "UPLOAD_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "START_IMPORT":
      return {
        ...state,
        step: "importing",
        error: null,
      };

    case "IMPORT_SUCCESS":
      return {
        ...state,
        step: "done",
        result: action.result,
        error: null,
      };

    case "IMPORT_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "RETRY_UPLOAD":
      return {
        ...initialState,
        file: state.file,
      };

    case "RETRY_IMPORT":
      return {
        ...state,
        step: "previewing",
        error: null,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useImportFlow() {
  const [state, dispatch] = useReducer(flowReducer, initialState);

  const actions = {
    startUpload: useCallback((file: File) =>
      dispatch({ type: "START_UPLOAD", file }), []),
    uploadSuccess: useCallback(
      (uploadId: string, headers: string[], preview: Record<string, string>[], rowCount: number) =>
        dispatch({ type: "UPLOAD_SUCCESS", uploadId, headers, preview, rowCount }), []),
    uploadError: useCallback((error: string) =>
      dispatch({ type: "UPLOAD_ERROR", error }), []),
    startImport: useCallback(() =>
      dispatch({ type: "START_IMPORT" }), []),
    importSuccess: useCallback((result: ImportResult) =>
      dispatch({ type: "IMPORT_SUCCESS", result }), []),
    importError: useCallback((error: string) =>
      dispatch({ type: "IMPORT_ERROR", error }), []),
    retryUpload: useCallback(() =>
      dispatch({ type: "RETRY_UPLOAD" }), []),
    retryImport: useCallback(() =>
      dispatch({ type: "RETRY_IMPORT" }), []),
    reset: useCallback(() =>
      dispatch({ type: "RESET" }), []),
  };

  return { state, actions };
}
