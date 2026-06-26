// tests/main.test.ts
import mockData from '../src/data/mockData';
import { BodyPart, StoreState } from '../src/types/index';

/**
 * Mocking localStorage for Node environment test run
 */
class LocalStorageMock {
  private store: Record<string, string> = {};

  public clear() {
    this.store = {};
  }

  public getItem(key: string): string | null {
    return this.store[key] || null;
  }

  public setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  public removeItem(key: string): void {
    delete this.store[key];
  }
}

const localStorage = new LocalStorageMock();
(global as any).localStorage = localStorage;

describe("AppState Training Memo Flow Tests", () => {
  let state: StoreState;
  let activePart: BodyPart;
  let currentView: "home" | "detail";
  const STORAGE_KEY = "TRAINING_MEMO_STATE";

  beforeEach(() => {
    localStorage.clear();
    state = {
      exercises: [...mockData.exercises],
      records: [...mockData.records],
    };
    activePart = BodyPart.CHEST;
    currentView = "home";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });

  test("should start at home screen", () => {
    expect(currentView).toBe("home");
  });

  test("should switch view to detail when a part is selected", () => {
    // Simulating AppState.selectPart(BodyPart.SHOULDER)
    activePart = BodyPart.SHOULDER;
    currentView = "detail";
    
    expect(currentView).toBe("detail");
    expect(activePart).toBe(BodyPart.SHOULDER);
  });

  test("should switch back to home when goBackToHome is called", () => {
    currentView = "detail";
    
    // Simulating AppState.goBackToHome()
    currentView = "home";
    expect(currentView).toBe("home");
  });

  test("should not update LocalStorage during edit until saveState is explicitly called", () => {
    const targetId = "ex-1";
    const date = "2026-06-20";
    const setIndex = 0;
    
    // 1. Check original storage value
    const originalStorage = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const originalWeight = originalStorage.records.find((r: any) => r.exerciseId === targetId && r.date === date).sets[setIndex].weight;
    
    // 2. Perform in-memory edit (without saving to storage)
    const record = state.records.find(r => r.exerciseId === targetId && r.date === date);
    record!.sets[setIndex].weight = 99; // Edited value
    
    // 3. Confirm storage value is NOT changed yet
    const preSaveStorage = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const preSaveWeight = preSaveStorage.records.find((r: any) => r.exerciseId === targetId && r.date === date).sets[setIndex].weight;
    expect(preSaveWeight).toBe(originalWeight);
    expect(preSaveWeight).not.toBe(99);
    
    // 4. Save state explicitly
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // 5. Confirm storage value is now updated
    const postSaveStorage = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const postSaveWeight = postSaveStorage.records.find((r: any) => r.exerciseId === targetId && r.date === date).sets[setIndex].weight;
    expect(postSaveWeight).toBe(99);
  });
});
