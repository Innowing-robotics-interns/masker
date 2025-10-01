export class Settings {
  constructor(canvas) {
    this.canvas = canvas;

    this.controls = document.createElement("div");
    this.controls.style.cssText = `
      position: fixed;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 15px;
      z-index: 1000;
    `;

    this.ai_brush_controls = this.createParameterSection(
      "🔧 AI Brush Controls",
    );
    this.brush_controls = this.createParameterSection("🖌️ Brush Controls");
    this.mask_controls = this.createParameterSection("🪨 Mask Controls");
    this.ai_brush_controls = this.controls.appendChild(this.ai_brush_controls);
    this.mask_controls = this.controls.appendChild(this.mask_controls);

    this.controls.appendChild(this.brush_controls);

    this.createParameterControls();
    this.createBrushControls();
    this.createMaskViewOptions();
  }

  createParameterSection(name) {
    const parameter_section = document.createElement("div");
    parameter_section.className = "parameter-section";
    parameter_section.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      font-size: 1vw !important;
      padding: 10px;
      border-radius: 5px;
      border: 1px solid #444;
      width: 20vw;

    `;

    const title = document.createElement("h4");
    title.textContent = name;
    title.style.cssText = "color: white; margin: 0 0 10px 0; font-size: 1vw;";
    parameter_section.appendChild(title);

    return parameter_section;
  }

  createParameterControls() {
    // Morphology controls
    const morphology_group = this.createParameterGroup("Morphology", [
      {
        label: "Apply Morphology",
        type: "checkbox",
        property: "apply_morphology",
        value: this.canvas.apply_morphology,
      },
      {
        label: "Kernel Size",
        type: "range",
        property: "morph_kernel_size",
        value: this.canvas.morph_kernel_size,
        min: 1,
        max: 15,
        step: 2,
      },
      {
        label: "Iterations",
        type: "range",
        property: "morph_iterations",
        value: this.canvas.morph_iterations,
        min: 1,
        max: 10,
        step: 1,
      },
    ]);

    // DBSCAN controls
    const dbscan_group = this.createParameterGroup("DBSCAN Clustering", [
      {
        label: "Apply DBSCAN",
        type: "checkbox",
        property: "apply_dbscan",
        value: this.canvas.apply_dbscan,
      },
      {
        label: "EPS (Distance)",
        type: "range",
        property: "db_eps",
        value: this.canvas.db_eps,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        label: "Min Samples",
        type: "range",
        property: "db_min_samples",
        value: this.canvas.db_min_samples,
        min: 1,
        max: 20,
        step: 1,
      },
    ]);

    const sensitivity_group = this.createParameterGroup("Sensitivity", [
      {
        label: "Sensitivity",
        type: "range",
        property: "sensitivity",
        value: this.canvas.sensitivity,
        min: 0,
        max: 100,
        step: 1,
      },
    ]);

    this.ai_brush_controls.appendChild(morphology_group);
    this.ai_brush_controls.appendChild(sensitivity_group);
    this.ai_brush_controls.appendChild(dbscan_group);
  }

  createBrushControls() {
    // Create section for brush size
    const brushSizeGroup = this.createParameterGroup("Brush Size", [
      {
        label: "Brush Size",
        type: "range",
        property: "brush_width",
        value: this.canvas.brush_width,
        min: 1,
        max: 50,
        step: 1,
        onInput: (newValue) => {
          this.canvas.brush_width = newValue;
        },
      },
    ]);

    this.brush_controls.appendChild(brushSizeGroup);
  }

  createMaskViewOptions() {
    const mask_view_options_group = this.createParameterGroup("Mask Display", [
      {
        label: "Mask Color",
        type: "color",
        property: "mask_display_color",
        value: "#ff0000", // Default red color in hex format
      },
    ]);

    this.mask_controls.appendChild(mask_view_options_group);
  }

  create;

  createParameterGroup(groupName, controls) {
    const group = document.createElement("div");
    group.className = "parameter-group";
    group.style.cssText = "margin-bottom: 15px;";

    const groupTitle = document.createElement("h5");
    groupTitle.textContent = groupName;
    groupTitle.style.cssText = `
      color: #ccc;
      margin: 0 0 8px 0;
      font-size: 0.9vw !important;
      border-bottom: 1px solid #555;
      padding-bottom: 3px;
    `;
    group.appendChild(groupTitle);

    controls.forEach((control) => {
      const controlDiv = document.createElement("div");
      controlDiv.style.cssText =
        "display: flex; align-items: center; margin-bottom: 8px; justify-content: space-between;";

      const label = document.createElement("label");
      label.textContent = control.label;
      label.style.cssText = "color: white; font-size: 11px; min-width: 80px;";

      let input;
      if (control.type === "checkbox") {
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = control.value;
        input.style.cssText = "margin-left: 5px;";

        input.addEventListener("change", (e) => {
          this.canvas[control.property] = e.target.checked;
          console.log(`${control.property} set to:`, e.target.checked);
        });
      } else if (control.type === "range") {
        const rangeContainer = document.createElement("div");
        rangeContainer.style.cssText =
          "display: flex; align-items: center; gap: 5px;";

        input = document.createElement("input");
        input.type = "range";
        input.min = control.min;
        input.max = control.max;
        input.step = control.step;
        input.value = control.value;
        input.style.cssText = "width: 80px;";

        const valueDisplay = document.createElement("span");
        const displayValue =
          control.step < 1 ? control.value.toFixed(1) : control.value;
        valueDisplay.textContent = displayValue;
        valueDisplay.style.cssText =
          "color: #ccc; font-size: 11px; min-width: 25px; text-align: center;";

        input.addEventListener("input", (e) => {
          const value =
            control.step === 1
              ? parseInt(e.target.value)
              : parseFloat(e.target.value);
          this.canvas[control.property] = value;
          const displayValue = control.step < 1 ? value.toFixed(1) : value;
          valueDisplay.textContent = displayValue;
          if (control.onInput) {
            control.onInput(value);
          }
          console.log(`${control.property} set to:`, value);
        });

        rangeContainer.appendChild(input);
        rangeContainer.appendChild(valueDisplay);
        input = rangeContainer;
      } else if (control.type === "color") {
        const colorContainer = document.createElement("div");
        colorContainer.style.cssText =
          "display: flex; align-items: center; gap: 5px;";

        input = document.createElement("input");
        input.type = "color";
        input.value = control.value;
        input.style.cssText = "width: 80px;";

        input.addEventListener("input", (e) => {
          const value = e.target.value;
          if (control.property === "mask_display_color") {
            // Convert hex to RGB format and call the canvas method
            const hex = value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const rgbColor = `rgb(${r}, ${g}, ${b})`;
            this.canvas.setMaskDisplayColor(rgbColor);
          } else {
            this.canvas[control.property] = value;
          }
          console.log(`${control.property} set to:`, value);
        });

        colorContainer.appendChild(input);
        input = colorContainer;
      }

      controlDiv.appendChild(label);
      if (input) {
        controlDiv.appendChild(input);
      }
      group.appendChild(controlDiv);
    });

    return group;
  }
}
