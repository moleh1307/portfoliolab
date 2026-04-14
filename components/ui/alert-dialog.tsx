'use client';

import { useEffect, useState } from 'react';

type AlertDialogState = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
};

let dialogState: AlertDialogState = {
  open: false,
  title: '',
  message: '',
  onConfirm: () => {},
};

type DialogListener = (state: AlertDialogState) => void;
const listeners: DialogListener[] = [];

function notifyListeners() {
  listeners.forEach((l) => l({ ...dialogState }));
}

export function confirmDialog(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    dialogState = {
      open: true,
      title,
      message,
      onConfirm: () => {
        dialogState = { ...dialogState, open: false };
        notifyListeners();
        resolve(true);
      },
    };
    notifyListeners();
  });
}

export function AlertDialog() {
  const [state, setState] = useState<AlertDialogState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={() => {
          dialogState = { ...dialogState, open: false };
          notifyListeners();
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-elevated animate-fade-in">
        <h3 className="text-[15px] font-semibold text-foreground">{state.title}</h3>
        <p className="mt-2 text-[13px] text-muted-foreground">{state.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-8 rounded-md border border-border bg-background px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => {
              dialogState = { ...dialogState, open: false };
              notifyListeners();
            }}
          >
            Cancel
          </button>
          <button
            className="h-8 rounded-md bg-negative px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-negative/90"
            onClick={state.onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}