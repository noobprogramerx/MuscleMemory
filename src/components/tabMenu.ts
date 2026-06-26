// src/components/tabMenu.ts
import { BodyPart } from '../types/index';

/**
 * Properties for the TabMenu component.
 */
export type TabMenuProps = {
  /** The currently selected body part tab */
  activePart: BodyPart;
  /** Callback fired when a tab is clicked */
  onPartChange: (part: BodyPart) => void;
};

/**
 * Renders the body part navigation tabs and handles user click events.
 * 
 * @param {HTMLElement} container - The element where the tabs will be rendered.
 * @param {TabMenuProps} props - Configuration and callbacks for the component.
 */
export function renderTabMenu(container: HTMLElement, props: TabMenuProps): void {
  container.innerHTML = "";
  
  const parts: BodyPart[] = [
    BodyPart.CHEST,
    BodyPart.SHOULDER,
    BodyPart.BYCEPS,
    BodyPart.BACK,
    BodyPart.TRICEPS
  ];
  
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
