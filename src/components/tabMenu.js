// src/components/tabMenu.js
/**
 * Renders the body part navigation tabs and handles user click events.
 * 
 * @param {HTMLElement} container - The element where the tabs will be rendered.
 * @param {object} props - Configuration and callbacks for the component.
 * @param {string} props.activePart - The currently selected body part tab.
 * @param {function} props.onPartChange - Callback fired when a tab is clicked.
 */
export function renderTabMenu(container, props) {
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
