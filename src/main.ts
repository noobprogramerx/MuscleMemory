// src/main.ts
import { BodyPart, Exercise, DayRecord, StoreState } from './types/index';
import mockData from './data/mockData';
import { renderRecordTable } from './components/recordTable';

const STORAGE_KEY = "TRAINING_MEMO_STATE";

/** Application View Types */
type ViewType = "home" | "detail";

/** Application State */
class AppState {
  private state: StoreState = { exercises: [], records: [] };
  private activePart: BodyPart = BodyPart.CHEST;
  private selectedDate: string = "";
  private currentView: ViewType = "home";

  constructor() {
    this.initDate();
    this.loadState();
  }

  /** Initialize selectedDate with local time (YYYY-MM-DD) */
  private initDate(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;
  }

  /** Load state from LocalStorage or initialize with mock data */
  private loadState(): void {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEY);
      if (dataStr) {
        this.state = JSON.parse(dataStr);
      } else {
        this.state = {
          exercises: [...mockData.exercises],
          records: [...mockData.records]
        };
        this.saveState();
      }
    } catch (error) {
      console.error("Failed to load state from LocalStorage:", error);
      this.state = { exercises: [], records: [] };
    }
  }

  /** Save current state to LocalStorage (Explicit save) */
  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.showToast("記録を保存しました！");
    } catch (error) {
      console.error("Failed to save state to LocalStorage:", error);
    }
  }

  /**
   * Export the current state as a JSON file download.
   */
  private exportState(): void {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEY);
      if (!dataStr) {
        alert("保存されている記録データがありません。");
        return;
      }
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      a.href = url;
      a.download = `training_memo_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export state:", error);
      alert("データのエクスポートに失敗しました。");
    }
  }

  /**
   * Import data from a selected JSON file backup.
   * 
   * @param {File} file - The JSON file to import.
   */
  private importState(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== "string") {
          throw new Error("Invalid file content type");
        }
        const data = JSON.parse(result) as StoreState;
        
        // Validate basic structure
        if (data && Array.isArray(data.exercises) && Array.isArray(data.records)) {
          if (confirm("バックアップデータを読み込みますか？\n警告：現在の記録データはすべて上書き消去されます。")) {
            this.state = data;
            this.saveState();
            alert("データの復元が完了しました！");
            location.reload();
          }
        } else {
          alert("エラー：無効なバックアップファイルです。データ構造が一致しません。");
        }
      } catch (error) {
        console.error("Failed to import state:", error);
        alert("エラー：ファイルの読み込みに失敗しました。ファイルが破損しているか、JSON形式ではありません。");
      }
    };
    reader.readAsText(file);
  }

  private showToast(msg: string): void {
    // Remove existing toast if any
    const oldToast = document.querySelector(".toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    // Force layout reflow
    toast.offsetHeight;
    
    toast.classList.add("show");
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 2000);
  }

  public getExercises(): Exercise[] {
    return this.state.exercises;
  }

  public getRecords(): DayRecord[] {
    return this.state.records;
  }

  public getActivePart(): BodyPart {
    return this.activePart;
  }

  public getSelectedDate(): string {
    return this.selectedDate;
  }

  public selectPart(part: BodyPart): void {
    this.activePart = part;
    this.currentView = "detail";
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  public goBackToHome(): void {
    this.currentView = "home";
    this.render();
  }

  public setSelectedDate(date: string): void {
    this.selectedDate = date;
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  /**
   * Finds the most recent record for an exercise before the selected date.
   */
  private getPreviousRecord(exerciseId: string): DayRecord | null {
    const pastRecords = this.state.records.filter(r => r.exerciseId === exerciseId && r.date < this.selectedDate);
    if (pastRecords.length === 0) return null;
    pastRecords.sort((a, b) => b.date.localeCompare(a.date));
    return pastRecords[0];
  }

  /**
   * Ensures that empty DayRecords exist for all exercises of the active body part on the selected date.
   */
  public ensureDayRecordsForCurrentPart(): void {
    const partExercises = this.state.exercises.filter(ex => ex.part === this.activePart);
    partExercises.forEach(ex => {
      const hasRecord = this.state.records.some(r => r.exerciseId === ex.id && r.date === this.selectedDate);
      if (!hasRecord) {
        const prevRec = this.getPreviousRecord(ex.id);
        const prevSetCount = prevRec?.sets?.length || 3;
        
        const emptySets = Array.from({ length: prevSetCount }, () => ({ weight: 0, reps: 0 }));
        
        const emptyRecord: DayRecord = {
          exerciseId: ex.id,
          date: this.selectedDate,
          sets: emptySets
        };
        this.state.records.push(emptyRecord);
      }
    });
  }

  /**
   * Update an exercise name (retains ID for historical logs).
   */
  public updateExerciseName(id: string, newName: string): void {
    const exercise = this.state.exercises.find(ex => ex.id === id);
    if (exercise) {
      exercise.name = newName;
      this.render();
    }
  }

  /**
   * Update weight or rep in a set.
   */
  public updateSet(exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number): void {
    let dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    
    if (!dayRecord) {
      this.ensureDayRecordsForCurrentPart();
      dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    }
    
    if (dayRecord && dayRecord.sets[setIndex]) {
      dayRecord.sets[setIndex][field] = value;
    }
  }

  /**
   * Add a set.
   */
  public addSet(exerciseId: string): void {
    let dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    if (!dayRecord) {
      this.ensureDayRecordsForCurrentPart();
      dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    }
    if (dayRecord) {
      dayRecord.sets.push({ weight: 0, reps: 0 });
      this.render();
    }
  }

  /**
   * Delete a set.
   */
  public deleteSet(exerciseId: string, setIndex: number): void {
    const dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    if (dayRecord && dayRecord.sets.length > 0) {
      dayRecord.sets.splice(setIndex, 1);
      this.render();
    }
  }

  /**
   * Add exercise definition.
   */
  public addExercise(): void {
    const newId = `ex-${Date.now()}`;
    const newEx: Exercise = {
      id: newId,
      name: "",
      part: this.activePart
    };
    
    this.state.exercises.push(newEx);
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  /**
   * Delete exercise definition.
   */
  public deleteExercise(id: string): void {
    this.state.exercises = this.state.exercises.filter(ex => ex.id !== id);
    this.render();
  }

  /** Render Home View with vertical part buttons and backup panel */
  private renderHomeView(container: HTMLElement): void {
    container.innerHTML = "";
    
    const homeContainer = document.createElement("div");
    homeContainer.className = "home-container";
    
    const partDetails: Record<BodyPart, { title: string; subtitle: string; emoji: string }> = {
      [BodyPart.CHEST]: { title: "胸 (CHEST)", subtitle: "厚い胸板と圧倒的なプッシュパワーを手に入れろ！", emoji: "🏋️‍♂️" },
      [BodyPart.SHOULDER]: { title: "肩 (SHOULDER)", subtitle: "広い肩幅、メロンのような屈強な肩を作れ！", emoji: "🦾" },
      [BodyPart.BYCEPS]: { title: "二頭筋 (BICEPS)", subtitle: "力強く太い、誰もが憧れる力こぶを鍛え上げろ！", emoji: "💪" },
      [BodyPart.BACK]: { title: "背中 (BACK)", subtitle: "広く鬼のような背中で、後ろ姿で語れ！", emoji: "🦅" },
      [BodyPart.TRICEPS]: { title: "三頭筋 (TRICEPS)", subtitle: "腕を最も太く見せる鍵、極太の三頭筋を仕上げろ！", emoji: "⚡" },
    };
    
    const parts: BodyPart[] = [
      BodyPart.CHEST,
      BodyPart.SHOULDER,
      BodyPart.BYCEPS,
      BodyPart.BACK,
      BodyPart.TRICEPS
    ];
    
    parts.forEach((part) => {
      const details = partDetails[part];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "home-btn";
      btn.addEventListener("click", () => this.selectPart(part));
      
      const titleSpan = document.createElement("span");
      titleSpan.className = "home-btn-title";
      titleSpan.textContent = `${details.emoji} ${details.title}`;
      
      const subSpan = document.createElement("span");
      subSpan.className = "home-btn-subtitle";
      subSpan.textContent = details.subtitle;
      
      btn.appendChild(titleSpan);
      btn.appendChild(subSpan);
      homeContainer.appendChild(btn);
    });
    
    container.appendChild(homeContainer);
    
    // Add Settings & Data Backup Panel (Accordion details)
    const settingsDiv = document.createElement("div");
    settingsDiv.className = "settings-container";
    
    const detailsEl = document.createElement("details");
    detailsEl.className = "settings-details";
    
    const summary = document.createElement("summary");
    summary.className = "settings-summary";
    summary.textContent = "⚙️ データ管理と引き継ぎ";
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "settings-content";
    
    const desc = document.createElement("p");
    desc.className = "settings-description";
    desc.textContent = "スマホの機種変更やブラウザ変更の際は、以下のボタンから記録データを保存・復元できます。";
    
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "settings-actions";
    
    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "btn-settings export";
    exportBtn.innerHTML = "📥 バックアップ保存";
    exportBtn.addEventListener("click", () => this.exportState());
    
    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "btn-settings import";
    importBtn.innerHTML = "📤 バックアップ読み込み";
    
    // File input for import (hidden)
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    fileInput.id = "importFileInput";
    fileInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        this.importState(target.files[0]);
      }
    });
    
    importBtn.addEventListener("click", () => {
      fileInput.click();
    });
    
    actionsDiv.appendChild(exportBtn);
    actionsDiv.appendChild(importBtn);
    actionsDiv.appendChild(fileInput);
    
    contentDiv.appendChild(desc);
    contentDiv.appendChild(actionsDiv);
    
    detailsEl.appendChild(summary);
    detailsEl.appendChild(contentDiv);
    settingsDiv.appendChild(detailsEl);
    
    container.appendChild(settingsDiv);
  }

  /** Render Detailed Record View for a chosen part */
  private renderDetailView(container: HTMLElement): void {
    container.innerHTML = "";
    
    // Header for Detail
    const detailHeader = document.createElement("div");
    detailHeader.className = "detail-header";
    
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn-back";
    backBtn.textContent = "◀ 部位選択に戻る";
    backBtn.addEventListener("click", () => this.goBackToHome());
    
    const title = document.createElement("div");
    title.className = "detail-title";
    title.textContent = `${this.activePart} の記録`;
    
    const datePicker = document.createElement("input");
    datePicker.type = "date";
    datePicker.id = "datePicker";
    datePicker.value = this.selectedDate;
    datePicker.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.setSelectedDate(target.value);
    });
    
    detailHeader.appendChild(backBtn);
    detailHeader.appendChild(title);
    detailHeader.appendChild(datePicker);
    container.appendChild(detailHeader);
    
    // Grid Table Area
    const tableArea = document.createElement("div");
    tableArea.id = "tableArea";
    container.appendChild(tableArea);
    
    renderRecordTable(tableArea, {
      activePart: this.activePart,
      selectedDate: this.selectedDate,
      exercises: this.state.exercises,
      records: this.state.records,
      onUpdateExerciseName: (id, newName) => this.updateExerciseName(id, newName),
      onUpdateSet: (exId, setIndex, field, value) => this.updateSet(exId, setIndex, field, value),
      onAddExercise: () => this.addExercise(),
      onDeleteExercise: (id) => this.deleteExercise(id),
      onAddSet: (exId) => this.addSet(exId),
      onDeleteSet: (exId, setIndex) => this.deleteSet(exId, setIndex)
    });
    
    // Save Button Container at the bottom
    const saveContainer = document.createElement("div");
    saveContainer.className = "save-container";
    
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn-save";
    saveBtn.innerHTML = "🔥 限界を記録して保存する！";
    saveBtn.addEventListener("click", () => this.saveState());
    
    saveContainer.appendChild(saveBtn);
    container.appendChild(saveContainer);
  }

  /** Render the whole application view */
  public render(): void {
    const appRootContainer = document.getElementById("appRoot");
    const tabMenu = document.getElementById("tabMenu");
    
    // Hide old global tab menu as it is replaced by vertical buttons
    if (tabMenu) {
      tabMenu.style.display = "none";
    }

    if (appRootContainer) {
      if (this.currentView === "home") {
        this.renderHomeView(appRootContainer);
      } else {
        this.renderDetailView(appRootContainer);
      }
    }
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new AppState();
    app.render();
  } catch (error) {
    console.error("Application initialization failed:", error);
  }
});
