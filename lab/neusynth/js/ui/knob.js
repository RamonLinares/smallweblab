/**
 * Tactile Neumorphic Rotary Knob Component
 * - Pointer drag (mouse, touch, pen) with Shift for fine control
 * - Mouse wheel
 * - Keyboard: arrows / Home / End when focused (role="slider")
 * - Double-click to reset
 * - onChange fires only when the value actually changes
 */

export class RotaryKnob {
  constructor(element, options = {}) {
    this.element = element;
    this.min = options.min ?? 0;
    this.max = options.max ?? 100;
    this.step = options.step ?? 0; // 0 = continuous
    this.defaultValue = options.defaultValue ?? this.min;
    this.unit = options.unit ?? "";
    this.name = options.name ?? (element.dataset.name || "Knob");
    this.onChange = options.onChange || null;
    this.format = options.format || null; // (value, norm) => string

    this.minAngle = -140;
    this.maxAngle = 140;

    this.isDragging = false;
    this.pointerId = null;
    this.startY = 0;
    this.startValue = 0;

    this.value = this._quantize(options.value ?? this.defaultValue);

    this._setupDOM();
    this._attachEvents();
    this._render();
  }

  get norm() {
    return (this.value - this.min) / ((this.max - this.min) || 1);
  }

  _setupDOM() {
    const el = this.element;
    el.classList.add("neu-knob");
    if (!el.querySelector(".knob-indicator")) {
      const indicator = document.createElement("div");
      indicator.className = "knob-indicator";
      el.appendChild(indicator);
    }
    el.setAttribute("role", "slider");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", this.name);
    el.setAttribute("aria-valuemin", String(this.min));
    el.setAttribute("aria-valuemax", String(this.max));
  }

  _attachEvents() {
    const el = this.element;

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      this.isDragging = true;
      this.pointerId = e.pointerId;
      this.startY = e.clientY;
      this.startValue = this.value;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      document.body.classList.add("knob-dragging");
    });

    el.addEventListener("pointermove", (e) => {
      if (!this.isDragging || e.pointerId !== this.pointerId) return;
      const deltaY = this.startY - e.clientY;
      const pixelsForFullRange = e.shiftKey ? 1000 : 200;
      const deltaVal = (deltaY / pixelsForFullRange) * (this.max - this.min);
      this.setValue(this.startValue + deltaVal, true);
    });

    const endDrag = (e) => {
      if (e.pointerId !== this.pointerId) return;
      this.isDragging = false;
      this.pointerId = null;
      document.body.classList.remove("knob-dragging");
    };
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      const range = this.max - this.min;
      const stepSize = this.step > 0 ? this.step : range / (e.shiftKey ? 250 : 50);
      this.setValue(this.value + direction * stepSize, true);
    }, { passive: false });

    el.addEventListener("dblclick", () => {
      this.setValue(this.defaultValue, true);
    });

    el.addEventListener("keydown", (e) => {
      const range = this.max - this.min;
      const stepSize = this.step > 0 ? this.step : range / (e.shiftKey ? 250 : 50);
      let next = null;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") next = this.value + stepSize;
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = this.value - stepSize;
      else if (e.key === "Home") next = this.min;
      else if (e.key === "End") next = this.max;
      if (next === null) return;
      e.preventDefault();
      e.stopPropagation();
      this.setValue(next, true);
    });
  }

  _quantize(v) {
    let c = Math.max(this.min, Math.min(this.max, Number(v) || 0));
    if (this.step > 0) {
      c = Math.round((c - this.min) / this.step) * this.step + this.min;
      c = Math.max(this.min, Math.min(this.max, c));
    }
    return c;
  }

  /** Set the value; returns true when it actually changed. */
  setValue(newVal, triggerChange = true) {
    const q = this._quantize(newVal);
    const changed = q !== this.value;
    this.value = q;
    this._render();
    if (changed && triggerChange && this.onChange) {
      this.onChange(this.value, this.norm, this);
    }
    return changed;
  }

  /** Position the knob from a 0..1 value without firing onChange. */
  setNorm(norm) {
    const n = Math.max(0, Math.min(1, Number(norm) || 0));
    this.setValue(this.min + n * (this.max - this.min), false);
  }

  _render() {
    const angle = this.minAngle + this.norm * (this.maxAngle - this.minAngle);
    this.element.style.transform = `rotate(${angle}deg)`;
    this.element.setAttribute("aria-valuenow", String(Math.round(this.value * 100) / 100));
    const text = this.formatValue();
    this.element.setAttribute("aria-valuetext", text);
    this.element.title = `${this.name}: ${text}`;
  }

  formatValue() {
    if (this.format) return this.format(this.value, this.norm);
    if (Number.isInteger(this.value)) return `${this.value}${this.unit}`;
    return `${this.value.toFixed(2)}${this.unit}`;
  }
}
