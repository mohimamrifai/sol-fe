"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

const MasterPageActionsContext = createContext<((actions: ReactNode) => void) | null>(null);

/** Registers page-level actions (e.g. Add) in the master layout header. */
export function useMasterPageActions(actions: ReactNode | null) {
  const setActions = useContext(MasterPageActionsContext);

  useEffect(() => {
    setActions?.(actions);
    return () => setActions?.(null);
  }, [actions, setActions]);
}

export function MasterPageActionsProvider({
  setActions,
  children,
}: {
  setActions: (actions: ReactNode) => void;
  children: ReactNode;
}) {
  return (
    <MasterPageActionsContext.Provider value={setActions}>
      {children}
    </MasterPageActionsContext.Provider>
  );
}
