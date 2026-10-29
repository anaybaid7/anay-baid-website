import { createContext } from 'react'

// which note is selected, shared by a wireframe and its note list
export const NoteCtx = createContext<{ on: number; pick: (n: number) => void }>({ on: 0, pick: () => {} })
