import type { DragEvent } from "react";

/** Posição de inserção ao arrastar sobre o item `index`: antes ou depois dele, conforme a metade. */
export function dropIndex(e: DragEvent<HTMLElement>, index: number): number {
  const rect = e.currentTarget.getBoundingClientRect();
  return e.clientY < rect.top + rect.height / 2 ? index : index + 1;
}

/** Move o item `from` para a posição de inserção `to` (contada antes de removê-lo). */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to > from ? to - 1 : to, 0, item);
  return next;
}

/** Arrastar algo que não é arquivo/texto: o Firefox só inicia o arrasto se houver dados. */
export function startDrag(e: DragEvent<HTMLElement>) {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", "");
}
