import { HistorySnapshot, WorkflowGraph } from "../../shared/types/index";
import { EventBus } from "../events/event-bus";

export class HistoryManager {
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private maxHistory: number;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, maxHistory: number = 50) {
    this.eventBus = eventBus;
    this.maxHistory = maxHistory;
  }

  /**
   * Pushes a new snapshot onto the undo stack.
   * Clears the redo stack.
   */
  push(snapshot: HistorySnapshot): void {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift(); // Remove the oldest entry
    }

    this.redoStack = []; // Any new action invalidates redos
    this.emitHistoryChanged();
  }

  /**
   * Undoes the last action, pushing the provided current state to the redo stack.
   * Returns the snapshot to be restored, or null if nothing to undo.
   */
  undo(currentState: HistorySnapshot): HistorySnapshot | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const previousSnapshot = this.undoStack.pop()!;
    this.redoStack.push(currentState);

    this.emitHistoryChanged();
    return previousSnapshot;
  }

  /**
   * Redoes the last undone action, pushing the provided current state to the undo stack.
   * Returns the snapshot to be restored, or null if nothing to redo.
   */
  redo(currentState: HistorySnapshot): HistorySnapshot | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const nextSnapshot = this.redoStack.pop()!;
    this.undoStack.push(currentState);

    this.emitHistoryChanged();
    return nextSnapshot;
  }

  /**
   * Clears the history stacks.
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.emitHistoryChanged();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private emitHistoryChanged(): void {
    this.eventBus.emit("history:changed", {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    });
  }
}
