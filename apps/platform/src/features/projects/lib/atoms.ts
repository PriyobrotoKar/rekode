import { atom } from 'jotai';

export const templateAtom = atom<string | 'blank' | null>(null);
export const configureProjectDialogOpenAtom = atom<boolean>(false);
