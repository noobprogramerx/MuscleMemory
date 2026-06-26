// src/components/recordTable.ts
import { BodyPart, Exercise, DayRecord, SetRecord } from '../types/index';

/**
 * Properties for the RecordTable component.
 */
export type RecordTableProps = {
  /** Currently selected body part */
  activePart: BodyPart;
  /** Selected date (YYYY-MM-DD) */
  selectedDate: string;
  /** All defined exercises */
  exercises: Exercise[];
  /** All recorded training data */
  records: DayRecord[];
  /** Fired when an exercise's name is modified */
  onUpdateExerciseName: (id: string, newName: string) => void;
  /** Fired when a weight or rep value is updated in a set */
  onUpdateSet: (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  /** Fired when a new exercise is added to the active body part */
  onAddExercise: () => void;
  /** Fired when an exercise is deleted */
  onDeleteExercise: (id: string) => void;
  /** Fired when a new set is appended to an exercise record */
  onAddSet: (exerciseId: string) => void;
  /** Fired when a specific set is deleted from an exercise record */
  onDeleteSet: (exerciseId: string, setIndex: number) => void;
};

/**
 * Finds the most recent record for an exercise before the selected date.
 * 
 * @param {string} exerciseId - The ID of the exercise.
 * @param {string} selectedDate - The boundary date.
 * @param {DayRecord[]} records - List of all day records.
 * @returns {DayRecord | null} The latest historical record or null.
 */
function getPreviousRecord(exerciseId: string, selectedDate: string, records: DayRecord[]): DayRecord | null {
  const pastRecords = records.filter(r => r.exerciseId === exerciseId && r.date < selectedDate);
  if (pastRecords.length === 0) return null;
  pastRecords.sort((a, b) => b.date.localeCompare(a.date));
  return pastRecords[0];
}

/**
 * Renders the interactive grid table for muscle training records.
 * 
 * @param {HTMLElement} container - Container element.
 * @param {RecordTableProps} props - Properties and callbacks.
 */
export function renderRecordTable(container: HTMLElement, props: RecordTableProps): void {
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
    
    // Header (fixed to 4 columns)
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
        const target = e.target as HTMLInputElement;
        try {
          props.onUpdateExerciseName(ex.id, target.value);
        } catch (error) {
          console.error("Failed to update exercise name:", error);
        }
      });
      nameTd.appendChild(nameInput);
      tr.appendChild(nameTd);
      
      // 2. Previous Record (Rendered as structured vertical list)
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
      const sets = dayRecord?.sets || [];
      
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
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(weightInput);
        inputGroup.appendChild(document.createTextNode(" x "));
        inputGroup.appendChild(repsInput);
        inputGroup.appendChild(miniDelBtn);
        
        // Underneath comparison hint
        const prevSetVal = prevRecord?.sets?.[sIdx];
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
