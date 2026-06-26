// src/main.js
/**
 * Muscle Training Record App - Consolidated Script for CORS-free local execution.
 * Built directly from modular TypeScript components.
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
// 2. Tab Menu Component
// ==========================================
/**
 * Renders the body part navigation tabs and handles user click events.
 * 
 * @param {HTMLElement} container - The element where the tabs will be rendered.
 * @param {object} props - Configuration and callbacks for the component.
 * @param {string} props.activePart - The currently selected body part tab.
 * @param {function} props.onPartChange - Callback fired when a tab is clicked.
 */
function renderTabMenu(container, props) {
  container.innerHTML = "";
  
  const parts = ["CHEST", "SHOULDER", "BYCEPS", "BACK", "TRICEPS"];
  
  parts.forEach((part) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = part;
    btn.className = part === props.activePart ? "active" : "";
    btn.id = `tab-${part.toLowerCase()}`;
    
    btn.addEventListener("click", () => {
      try {
        props.onPartChange(part);
      } catch (error) {
        console.error("TabMenu click error:", error);
      }
    });
    
    container.appendChild(btn);
  });
}

// ==========================================
// 3. Record Table Component
// ==========================================
/**
 * Finds the most recent record for an exercise before the selected date.
 * 
 * @param {string} exerciseId - The ID of the exercise.
 * @param {string} selectedDate - The boundary date.
 * @param {object[]} records - List of all day records.
 * @returns {object | null} The latest historical record or null.
 */
function getPreviousRecord(exerciseId, selectedDate, records) {
  const pastRecords = records.filter(r => r.exerciseId === exerciseId && r.date < selectedDate);
  if (pastRecords.length === 0) return null;
  pastRecords.sort((a, b) => b.date.localeCompare(a.date));
  return pastRecords[0];
}

/**
 * Formats set records to a readable string (e.g. "S1: 60kg x 10, S2: 60kg x 9").
 * 
 * @param {object[]} sets - Array of sets.
 * @returns {string} Formatted string.
 */
function formatSets(sets) {
  if (!sets || sets.length === 0) return "-";
  return sets.map((s, idx) => `S${idx + 1}: ${s.weight}kg x ${s.reps}`).join(", ");
}

/**
 * Renders the interactive grid table for muscle training records.
 * 
 * @param {HTMLElement} container - Container element.
 * @param {object} props - Properties and callbacks.
 */
function renderRecordTable(container, props) {
  container.innerHTML = "";
  
  // Filter exercises belonging to the active body part
  const partExercises = props.exercises.filter(ex => ex.part === props.activePart);
  
  if (partExercises.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty";
    emptyDiv.textContent = "この部位の種目は登録されていません。下のボタンから追加してください。";
    container.appendChild(emptyDiv);
  } else {
    const table = document.createElement("table");
    
    // Header (fixed to 4 columns for dynamic set width container)
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th style="width: 25%;">種目名</th>
        <th style="width: 25%;">前回記録</th>
        <th style="width: 40%;">今回の記録（重量 x 回数）</th>
        <th style="width: 10%; text-align: center;">操作</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Body
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
      
      // 2. Previous Record
      const prevTd = document.createElement("td");
      const prevRecord = getPreviousRecord(ex.id, props.selectedDate, props.records);
      prevTd.textContent = prevRecord 
        ? `${prevRecord.date}: ${formatSets(prevRecord.sets)}` 
        : "記録なし";
      prevTd.style.fontSize = "0.85rem";
      prevTd.style.opacity = "0.7";
      tr.appendChild(prevTd);
      
      // 3. Current Day Record (Dynamic list of sets)
      const dayRecord = props.records.find(r => r.exerciseId === ex.id && r.date === props.selectedDate);
      const sets = (dayRecord && dayRecord.sets) || [];
      
      const setsTd = document.createElement("td");
      const setsContainer = document.createElement("div");
      setsContainer.className = "sets-container";
      
      sets.forEach((setVal, sIdx) => {
        const setDiv = document.createElement("div");
        setDiv.className = "set-item";
        
        const label = document.createElement("span");
        label.textContent = `${sIdx + 1}:`;
        label.style.fontSize = "0.8rem";
        label.style.opacity = "0.8";
        label.style.marginRight = "2px";
        
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
        
        // Mini delete button to remove a set
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
        
        setDiv.appendChild(label);
        setDiv.appendChild(weightInput);
        setDiv.appendChild(document.createTextNode(" x "));
        setDiv.appendChild(repsInput);
        setDiv.appendChild(miniDelBtn);
        
        setsContainer.appendChild(setDiv);
      });
      
      // Add set button for this row
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
  
  // Add Exercise button
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
// 4. Main Application Controller
// ==========================================
const STORAGE_KEY = "TRAINING_MEMO_STATE";

class AppState {
  constructor() {
    this.state = { exercises: [], records: [] };
    this.activePart = "CHEST";
    this.selectedDate = "";
    
    this.initDate();
    this.loadState();
  }

  /** Initialize selectedDate with local time (YYYY-MM-DD) */
  initDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;
  }

  /** Load state from LocalStorage or initialize with mock data */
  loadState() {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEY);
      if (dataStr) {
        this.state = JSON.parse(dataStr);
      } else {
        // Fallback to initial mock data
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

  /** Save current state to LocalStorage */
  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error("Failed to save state to LocalStorage:", error);
    }
  }

  setActivePart(part) {
    this.activePart = part;
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  setSelectedDate(date) {
    this.selectedDate = date;
    this.ensureDayRecordsForCurrentPart();
    this.render();
  }

  /**
   * Finds the most recent record for an exercise before the selected date.
   */
  getPreviousRecord(exerciseId) {
    const pastRecords = this.state.records.filter(r => r.exerciseId === exerciseId && r.date < this.selectedDate);
    if (pastRecords.length === 0) return null;
    pastRecords.sort((a, b) => b.date.localeCompare(a.date));
    return pastRecords[0];
  }

  /**
   * Ensures that empty DayRecords exist for all exercises of the active body part on the selected date.
   * Carries over the number of sets from the previous session, or defaults to 3 sets.
   */
  ensureDayRecordsForCurrentPart() {
    const partExercises = this.state.exercises.filter(ex => ex.part === this.activePart);
    partExercises.forEach(ex => {
      const hasRecord = this.state.records.some(r => r.exerciseId === ex.id && r.date === this.selectedDate);
      if (!hasRecord) {
        // Carry over set count from previous record, default to 3
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
    this.saveState();
  }

  /**
   * Update an exercise name (retains its ID to keep historical logs linked).
   */
  updateExerciseName(id, newName) {
    const exercise = this.state.exercises.find(ex => ex.id === id);
    if (exercise) {
      exercise.name = newName;
      this.saveState();
      this.render();
    }
  }

  /**
   * Update specific weight or rep data inside a set.
   */
  updateSet(exerciseId, setIndex, field, value) {
    let dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    
    if (!dayRecord) {
      this.ensureDayRecordsForCurrentPart();
      dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    }
    
    if (dayRecord && dayRecord.sets[setIndex]) {
      dayRecord.sets[setIndex][field] = value;
      this.saveState();
    }
  }

  /**
   * Appends a new empty set to an exercise day record.
   */
  addSet(exerciseId) {
    let dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    if (!dayRecord) {
      this.ensureDayRecordsForCurrentPart();
      dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    }
    if (dayRecord) {
      dayRecord.sets.push({ weight: 0, reps: 0 });
      this.saveState();
      this.render();
    }
  }

  /**
   * Deletes a specific set from an exercise day record.
   */
  deleteSet(exerciseId, setIndex) {
    const dayRecord = this.state.records.find(r => r.exerciseId === exerciseId && r.date === this.selectedDate);
    if (dayRecord && dayRecord.sets.length > 0) {
      dayRecord.sets.splice(setIndex, 1);
      this.saveState();
      this.render();
    }
  }

  /**
   * Add a new exercise row to the current active body part.
   */
  addExercise() {
    const newId = `ex-${Date.now()}`;
    const newEx = {
      id: newId,
      name: "",
      part: this.activePart
    };
    
    this.state.exercises.push(newEx);
    this.ensureDayRecordsForCurrentPart();
    this.saveState();
    this.render();
  }

  /**
   * Delete an exercise definition (keeps records in data for safety, but hides from UI).
   */
  deleteExercise(id) {
    this.state.exercises = this.state.exercises.filter(ex => ex.id !== id);
    this.saveState();
    this.render();
  }

  /** Render the whole application view */
  render() {
    const tabMenuContainer = document.getElementById("tabMenu");
    const appRootContainer = document.getElementById("appRoot");
    const datePicker = document.getElementById("datePicker");

    if (datePicker && datePicker.value !== this.selectedDate) {
      datePicker.value = this.selectedDate;
    }

    if (tabMenuContainer) {
      renderTabMenu(tabMenuContainer, {
        activePart: this.activePart,
        onPartChange: (part) => this.setActivePart(part)
      });
    }

    if (appRootContainer) {
      renderRecordTable(appRootContainer, {
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
    }
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new AppState();
    
    const datePicker = document.getElementById("datePicker");
    if (datePicker) {
      datePicker.addEventListener("change", (e) => {
        app.setSelectedDate(e.target.value);
      });
    }
    
    app.ensureDayRecordsForCurrentPart();
    app.render();
  } catch (error) {
    console.error("Application initialization failed:", error);
  }
});
