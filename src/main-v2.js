// src/main-v2.js
/**
 * Muscle Training Record App - Consolidated Script (v2 with vertical home menu, per-part date, and save buttons)
 */

// ==========================================
// 1. Mock Data Definition
// ==========================================
const mockData = {
  exercises: [
    { id: "ex-1", name: "ベンチプレス", part: "CHEST" },
    { id: "ex-2", name: "インクラインダンベルプレス", part: "CHEST" },
    { id: "ex-3", name: "ショルダープレス", part: "SHOULDER" },
    { id: "ex-4", name: "サイドレイズ", part: "SHOULDER" },
    { id: "ex-5", name: "アームカール", part: "BYCEPS" },
    { id: "ex-6", name: "ラットプルダウン", part: "BACK" },
    { id: "ex-7", name: "プレスダウン", part: "TRICEPS" }
  ],
  records: [
    {
      exerciseId: "ex-1",
      date: "2026-06-20",
      sets: [
        { weight: 60, reps: 10 },
        { weight: 60, reps: 9 },
        { weight: 55, reps: 10 }
      ]
    },
    {
      exerciseId: "ex-3",
      date: "2026-06-20",
      sets: [
        { weight: 20, reps: 10 },
        { weight: 20, reps: 8 }
      ]
    }
  ]
};

// ==========================================
// 2. Helper & Component Rendering
// ==========================================
function getPreviousRecord(exerciseId, selectedDate, records) {
  const pastRecords = records.filter(r => r.exerciseId === exerciseId && r.date < selectedDate);
  if (pastRecords.length === 0) return null;
  pastRecords.sort((a, b) => b.date.localeCompare(a.date));
  return pastRecords[0];
}

function formatSets(sets) {
  if (!sets || sets.length === 0) return "-";
  return sets.map((s, idx) => `S${idx + 1}: ${s.weight}kg x ${s.reps}`).join(", ");
}

function renderRecordTable(container, props) {
  container.innerHTML = "";
  
  const partExercises = props.exercises.filter(ex => ex.part === props.activePart);
  
  if (partExercises.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty";
    emptyDiv.textContent = "この部位の種目は登録されていません。下のボタンから追加してください。";
    container.appendChild(emptyDiv);
  } else {
    const table = document.createElement("table");
    
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th style="width: 30%;">種目名</th>
        <th style="width: 15%;">前回記録</th>
        <th style="width: 45%;">今回の記録（重量 x 回数）</th>
        <th style="width: 10%; text-align: center;">操作</th>
      </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    partExercises.forEach(ex => {
      const tr = document.createElement("tr");
      tr.id = `row-${ex.id}`;
      
      // 1. Exercise Name
      const nameTd = document.createElement("td");
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = ex.name;
      nameInput.id = `input-name-${ex.id}`;
      nameInput.addEventListener("change", (e) => {
        try {
          props.onUpdateExerciseName(ex.id, e.target.value);
        } catch (error) {
          console.error("Failed to update exercise name:", error);
        }
      });
      nameTd.appendChild(nameInput);
      tr.appendChild(nameTd);
      
      // 2. Previous Record (Vertical format)
      const prevTd = document.createElement("td");
      const prevRecord = getPreviousRecord(ex.id, props.selectedDate, props.records);
      if (prevRecord) {
        prevTd.innerHTML = "";
        
        const dateDiv = document.createElement("div");
        dateDiv.className = "prev-record-date";
        dateDiv.textContent = prevRecord.date;
        prevTd.appendChild(dateDiv);
        
        const listContainer = document.createElement("div");
        listContainer.className = "prev-sets-list";
        
        prevRecord.sets.forEach((s, idx) => {
          const setRow = document.createElement("div");
          setRow.className = "prev-set-row";
          setRow.textContent = `S${idx + 1}: ${s.weight}kg × ${s.reps}`;
          listContainer.appendChild(setRow);
        });
        prevTd.appendChild(listContainer);
      } else {
        prevTd.textContent = "記録なし";
        prevTd.style.opacity = "0.5";
      }
      prevTd.style.fontSize = "0.85rem";
      tr.appendChild(prevTd);
      
      // 3. Current Day Record (Dynamic list of sets with matching motivator values)
      const dayRecord = props.records.find(r => r.exerciseId === ex.id && r.date === props.selectedDate);
      const sets = (dayRecord && dayRecord.sets) || [];
      
      const setsTd = document.createElement("td");
      const setsContainer = document.createElement("div");
      setsContainer.className = "sets-container";
      
      sets.forEach((setVal, sIdx) => {
        const setDiv = document.createElement("div");
        setDiv.className = "set-item";
        
        // Input layout row
        const inputGroup = document.createElement("div");
        inputGroup.className = "set-input-group";
        
        const label = document.createElement("span");
        label.className = "set-item-label";
        label.textContent = `${sIdx + 1}:`;
        
        const weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.style.width = "60px";
        weightInput.placeholder = "kg";
        weightInput.value = setVal.weight > 0 ? String(setVal.weight) : "";
        weightInput.id = `input-w-${ex.id}-set-${sIdx}`;
        
        const repsInput = document.createElement("input");
        repsInput.type = "number";
        repsInput.style.width = "45px";
        repsInput.placeholder = "回";
        repsInput.value = setVal.reps > 0 ? String(setVal.reps) : "";
        repsInput.id = `input-r-${ex.id}-set-${sIdx}`;
        
        const handleChange = () => {
          try {
            const w = parseFloat(weightInput.value) || 0;
            const r = parseInt(repsInput.value, 10) || 0;
            props.onUpdateSet(ex.id, sIdx, 'weight', w);
            props.onUpdateSet(ex.id, sIdx, 'reps', r);
          } catch (error) {
            console.error("Failed to update set data:", error);
          }
        };
        
        weightInput.addEventListener("change", handleChange);
        repsInput.addEventListener("change", handleChange);
        
        const miniDelBtn = document.createElement("button");
        miniDelBtn.type = "button";
        miniDelBtn.className = "btn-mini-del";
        miniDelBtn.textContent = "×";
        miniDelBtn.title = "このセットを削除";
        miniDelBtn.addEventListener("click", () => {
          try {
            props.onDeleteSet(ex.id, sIdx);
          } catch (error) {
            console.error("Failed to delete set:", error);
          }
        });
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(weightInput);
        inputGroup.appendChild(document.createTextNode(" x "));
        inputGroup.appendChild(repsInput);
        inputGroup.appendChild(miniDelBtn);
        
        // Underneath comparison hint
        const prevSetVal = prevRecord && prevRecord.sets && prevRecord.sets[sIdx];
        const prevHint = document.createElement("div");
        prevHint.className = "set-prev-hint";
        if (prevSetVal) {
          prevHint.textContent = `前回: ${prevSetVal.weight}kg × ${prevSetVal.reps}`;
        } else {
          prevHint.textContent = `前回: --`;
        }
        
        setDiv.appendChild(inputGroup);
        setDiv.appendChild(prevHint);
        
        setsContainer.appendChild(setDiv);
      });
      
      const addSetBtn = document.createElement("button");
      addSetBtn.type = "button";
      addSetBtn.className = "btn-add-set";
      addSetBtn.textContent = "+ セット追加";
      addSetBtn.addEventListener("click", () => {
        try {
          props.onAddSet(ex.id);
        } catch (error) {
          console.error("Failed to append set:", error);
        }
      });
      setsContainer.appendChild(addSetBtn);
      
      setsTd.appendChild(setsContainer);
      tr.appendChild(setsTd);
      
      // 4. Action
      const actionTd = document.createElement("td");
      actionTd.style.textAlign = "center";
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "action delete";
      delBtn.textContent = "削除";
      delBtn.id = `btn-del-${ex.id}`;
      delBtn.addEventListener("click", () => {
        if (confirm(`「${ex.name || '新しい種目'}」を削除してもよろしいですか？（過去のデータは残ります）`)) {
          try {
            props.onDeleteExercise(ex.id);
          } catch (error) {
            console.error("Failed to delete exercise:", error);
          }
        }
      });
      actionTd.appendChild(delBtn);
      tr.appendChild(actionTd);
      
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }
  
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "action";
  addBtn.textContent = "+ 種目を追加する";
  addBtn.id = "btnAddExercise";
  addBtn.addEventListener("click", () => {
    try {
      props.onAddExercise();
    } catch (error) {
      console.error("Failed to add exercise:", error);
    }
  });
  container.appendChild(addBtn);
}

// ==========================================
// 3. Main Application State Controller
// ==========================================
const STORAGE_KEY = "TRAINING_MEMO_STATE";

class AppState {
  constructor() {
    this.state = { exercises: [], records: [] };
    this.activePart = "CHEST";
    this.selectedDate = "";
    this.currentView = "home"; // "home" | "detail"
    
    this.initDate();
    this.loadState();
  }

  initDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;
  }

  loadState() {
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

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.showToast("記録を保存しました！");
    } catch (error) {
      console.error("Failed to save state to LocalStorage:", error);
    }
  }

  exportState() {
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

  importState(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target.result;
        const data = JSON.parse(result);
        
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

  showToast(msg) {
    const oldToast = document.querySelector(".toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    toast.offsetHeight; // force reflow
    toast.classList.add("show");
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 2000);
  }

  selectPart(part) {
    this.activePart = part;
    this.currentView = "detail";
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  goBackToHome() {
    this.currentView = "home";
    this.render();
  }

  setSelectedDate(date) {
    this.selectedDate = date;
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  getPreviousRecord(exerciseId) {
    const pastRecords = this.state.records.filter(r => r.exerciseId === exerciseId && r.date < this.selectedDate);
    if (pastRecords.length === 0) return null;
    pastRecords.sort((a, b) => b.date.localeCompare(a.date));
    return pastRecords[0];
  }

  ensureDayRecordsForCurrentPart() {
    const partExercises = this.state.exercises.filter(ex => ex.part === this.activePart);
    partExercises.forEach(ex => {
      const hasRecord = this.state.records.some(r => r.exerciseId === ex.id && r.date === this.selectedDate);
      if (!hasRecord) {
        const prevRec = this.getPreviousRecord(ex.id);
        const prevSetCount = (prevRec && prevRec.sets && prevRec.sets.length) || 3;
        
        const emptySets = Array.from({ length: prevSetCount }, () => ({ weight: 0, reps: 0 }));
        
        const emptyRecord = {
          exerciseId: ex.id,
          date: this.selectedDate,
          sets: emptySets
        };
        this.state.records.push(emptyRecord);
      }
    });
  }

  updateExerciseName(id, newName) {
    const exercise = this.state.exercises.find(ex => ex.id === id);
    if (exercise) {
      exercise.name = newName;
      this.render();
    }
  }

  updateSet(exerciseId, setIndex, field, value) {
    let dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    if (!dayRecord) {
      this.ensureDayRecordsForCurrentPart();
      dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    }
    if (dayRecord && dayRecord.sets[setIndex]) {
      dayRecord.sets[setIndex][field] = value;
    }
  }

  addSet(exerciseId) {
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

  deleteSet(exerciseId, setIndex) {
    const dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    if (dayRecord && dayRecord.sets.length > 0) {
      dayRecord.sets.splice(setIndex, 1);
      this.render();
    }
  }

  addExercise() {
    const newId = `ex-${Date.now()}`;
    const newEx = {
      id: newId,
      name: "",
      part: this.activePart
    };
    this.state.exercises.push(newEx);
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  deleteExercise(id) {
    this.state.exercises = this.state.exercises.filter(ex => ex.id !== id);
    this.render();
  }

  renderHomeView(container) {
    container.innerHTML = "";
    
    const homeContainer = document.createElement("div");
    homeContainer.className = "home-container";
    
    const partDetails = {
      CHEST: { title: "胸 (CHEST)", subtitle: "厚い胸板と圧倒的なプッシュパワーを手に入れろ！", emoji: "🏋️‍♂️" },
      SHOULDER: { title: "肩 (SHOULDER)", subtitle: "広い肩幅、メロンのような屈強な肩を作れ！", emoji: "🦾" },
      BYCEPS: { title: "二頭筋 (BICEPS)", subtitle: "力強く太い、誰もが憧れる力こぶを鍛え上げろ！", emoji: "💪" },
      BACK: { title: "背中 (BACK)", subtitle: "広く鬼のような背中で、後ろ姿で語れ！", emoji: "🦅" },
      TRICEPS: { title: "三頭筋 (TRICEPS)", subtitle: "腕を最も太く見せる鍵、極太の三頭筋を仕上げろ！", emoji: "⚡" }
    };
    
    const parts = ["CHEST", "SHOULDER", "BYCEPS", "BACK", "TRICEPS"];
    
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
      const target = e.target;
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

  renderDetailView(container) {
    container.innerHTML = "";
    
    // Header setup
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
      this.setSelectedDate(e.target.value);
    });
    
    detailHeader.appendChild(backBtn);
    detailHeader.appendChild(title);
    detailHeader.appendChild(datePicker);
    container.appendChild(detailHeader);
    
    // Grid area
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
    
    // Save button
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

  render() {
    const appRootContainer = document.getElementById("appRoot");
    const tabMenu = document.getElementById("tabMenu");
    
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

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new AppState();
    app.render();
  } catch (error) {
    console.error("Application initialization failed:", error);
  }
});
