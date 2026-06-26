// src/components/recordTable.js

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
export function renderRecordTable(container, props) {
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
