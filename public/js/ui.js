export class UI {
  constructor(ui_container_ID, canvas, file_system) {
    this.canvas = canvas;
    this.file_system = file_system;
    this.container = document.getElementById(ui_container_ID);
    this.cursor = document.getElementById("custom-cursor");
    document.body.style.cursor = "none";
    this.init();
    this.add_event_listeners();
  }

  add_event_listeners() {
    this.back_btn.addEventListener("click", () => {
      window.location.href = "/";
    });
    this.open_img_btn.addEventListener("click", this.openImg.bind(this));
    this.upload_img_btn.addEventListener("click", this.uplaodImage.bind(this));
    this.upload_mask_btn.addEventListener("click", this.uplaodLabel.bind(this));
    this.save_btn.addEventListener("click", this.saveLabel.bind(this));
    this.redo_btn.addEventListener("click", this.canvas.redo.bind(this.canvas));
    this.undo_btn.addEventListener("click", this.canvas.undo.bind(this.canvas));
    this.clear_btn.addEventListener(
      "click",
      this.canvas.resetMask.bind(this.canvas),
    );
    this.toggle_mask_btn.addEventListener(
      "click",
      this.canvas.toggleMask.bind(this.canvas),
    );
    this.hide_btn.addEventListener("click", this.toggleUI.bind(this));
    this.switch_color_btn.addEventListener(
      "click",
      this.canvas.switchColor.bind(this.canvas),
    );
    this.switch_mode_btn.addEventListener(
      "click",
      this.canvas.switchBrushMode.bind(this.canvas),
    );
    this.inc_pensize_btn.addEventListener("click", () =>
      this.canvas.changeBrushSize(8),
    );
    this.dec_pensize_btn.addEventListener("click", () =>
      this.canvas.changeBrushSize(-2),
    );
    this.toggle_params_btn.addEventListener(
      "click",
      this.toggleParameterPanel.bind(this),
    );
    this.zoom_in_btn.addEventListener(
      "click",
      this.canvas.zoomIn.bind(this.canvas),
    );
    this.zoom_out_btn.addEventListener(
      "click",
      this.canvas.zoomOut.bind(this.canvas),
    );
    window.addEventListener("keydown", this.keyboard_shortcuts.bind(this));
  }

  init() {
    const back_btn = document.createElement("button");
    back_btn.textContent = "🚪 Back";
    back_btn.className = "control-button";
    back_btn.id = "back";
    this.back_btn = back_btn;

    const open_img_btn = document.createElement("button");
    open_img_btn.textContent = "📂 Open Image (o)";
    open_img_btn.className = "control-button";
    open_img_btn.id = "open-image";
    this.open_img_btn = open_img_btn;

    const upload_img_btn = document.createElement("button");
    upload_img_btn.textContent = "📂 Upload Image";
    upload_img_btn.className = "control-button";
    upload_img_btn.id = "upload-image";
    this.upload_img_btn = upload_img_btn;

    const upload_mask_btn = document.createElement("button");
    upload_mask_btn.textContent = "📂 Upload Mask";
    upload_mask_btn.className = "control-button";
    upload_mask_btn.id = "upload-mask";
    this.upload_mask_btn = upload_mask_btn;

    const save_btn = document.createElement("button");
    save_btn.textContent = "💾 Save Mask (s)";
    save_btn.className = "control-button";
    save_btn.id = "save";
    this.save_btn = save_btn;

    const hide_btn = document.createElement("button");
    hide_btn.textContent = "👁️ Hide UI (h)";
    hide_btn.className = "control-button";
    hide_btn.id = "hide-mask";
    this.hide_btn = hide_btn;

    const toggle_mask_btn = document.createElement("button");
    toggle_mask_btn.textContent = "👁️ Toggle Mask (m)";
    toggle_mask_btn.className = "control-button";
    toggle_mask_btn.id = "toggle-mask";
    this.toggle_mask_btn = toggle_mask_btn;

    const inc_pensize_btn = document.createElement("button");
    inc_pensize_btn.textContent = "➕ Pen Size (e/3)";
    inc_pensize_btn.className = "control-button";
    inc_pensize_btn.id = "inc-pensize";
    this.inc_pensize_btn = inc_pensize_btn;

    const dec_pensize_btn = document.createElement("button");
    dec_pensize_btn.textContent = "➖ Pen Size (q/1)";
    dec_pensize_btn.className = "control-button";
    dec_pensize_btn.id = "dec-pensize";
    this.dec_pensize_btn = dec_pensize_btn;

    const switch_color_btn = document.createElement("button");
    switch_color_btn.textContent = `Switch Color (c)`;
    switch_color_btn.className = "control-button";
    switch_color_btn.id = "switch-color";
    this.switch_color_btn = switch_color_btn;

    const switch_mode_btn = document.createElement("button");
    switch_mode_btn.textContent = `Switch Brush Mode (b)`;
    switch_mode_btn.className = "control-button";
    switch_mode_btn.id = "switch-mode";
    this.switch_mode_btn = switch_mode_btn;

    const clear_btn = document.createElement("button");
    clear_btn.textContent = "🗑️ Clear Mask (f)";
    clear_btn.className = "control-button";
    clear_btn.id = "clear-mask";
    this.clear_btn = clear_btn;

    const undo_btn = document.createElement("button");
    undo_btn.textContent = "↩️ Undo (ctrl+z)";
    undo_btn.className = "control-button";
    undo_btn.id = "undo";
    this.undo_btn = undo_btn;

    const redo_btn = document.createElement("button");
    redo_btn.textContent = "↪️ Redo (ctrl+y)";
    redo_btn.className = "control-button";
    redo_btn.id = "redo";
    redo_btn.addEventListener("click", this.canvas.redo.bind(this.canvas));
    this.redo_btn = redo_btn;

    const toggle_params_btn = document.createElement("button");
    toggle_params_btn.textContent = "🔧 Toggle Parameters (p)";
    toggle_params_btn.className = "control-button";
    toggle_params_btn.id = "toggle-params";
    this.toggle_params_btn = toggle_params_btn;

    const zoom_in_btn = document.createElement("button");
    zoom_in_btn.textContent = "🔍 Zoom In (+)";
    zoom_in_btn.className = "control-button";
    zoom_in_btn.id = "zoom-in";
    this.zoom_in_btn = zoom_in_btn;

    const zoom_out_btn = document.createElement("button");
    zoom_out_btn.textContent = "🔍 Zoom Out (-)";
    zoom_out_btn.className = "control-button";
    zoom_out_btn.id = "zoom-out";
    this.zoom_out_btn = zoom_out_btn;

    // Parameter controls section
    this.createParameterControls();

    this.container.appendChild(back_btn);
    this.container.appendChild(open_img_btn);
    this.container.appendChild(upload_img_btn);
    this.container.appendChild(upload_mask_btn);
    this.container.appendChild(save_btn);
    this.container.appendChild(hide_btn);
    this.container.appendChild(toggle_mask_btn);
    this.container.appendChild(inc_pensize_btn);
    this.container.appendChild(dec_pensize_btn);
    this.container.appendChild(switch_color_btn);
    this.container.appendChild(switch_mode_btn);
    this.container.appendChild(clear_btn);
    this.container.appendChild(undo_btn);
    this.container.appendChild(redo_btn);
    this.container.appendChild(toggle_params_btn);
    this.container.appendChild(zoom_in_btn);
    this.container.appendChild(zoom_out_btn);

    // Add parameter controls to the container
    this.container.appendChild(this.parameter_section);
  }

  createParameterControls() {
    // Create a section for parameter controls
    const parameter_section = document.createElement("div");
    parameter_section.className = "parameter-section";
    parameter_section.id = "parameter-controls";
    parameter_section.style.cssText = `
            position: fixed;
            top: 30vh;
            left: 0;
            background: rgba(0, 0, 0, 0.7);
            font-size: 1vw !important;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border: 1px solid #444;
            width: 20vw;
            height: 40vh;
            z-index: 1000;
        `;

    const title = document.createElement("h4");
    title.textContent = "🔧 Prediction Parameters";
    title.style.cssText = "color: white; margin: 0 0 10px 0; font-size: 1vw;";
    parameter_section.appendChild(title);

    // Morphology controls
    const morphology_group = this.createParameterGroup("Morphology", [
      {
        label: "Apply Morphology",
        type: "checkbox",
        property: "apply_morphology",
        value: this.canvas.apply_morphology,
        style: "font-size: 1vw !important; width:100%; height: 50%;",
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
    morphology_group.style.cssText = `
            font-size: 1vw !important;
            width: 20vw;
        `;

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

    parameter_section.appendChild(morphology_group);
    parameter_section.appendChild(dbscan_group);
    parameter_section.appendChild(sensitivity_group);

    this.parameter_section = parameter_section;
  }

  createParameterGroup(groupName, controls) {
    const group = document.createElement("div");
    group.className = "parameter-group";
    group.style.cssText = "margin-bottom: 15px;";

    const groupTitle = document.createElement("h5");
    groupTitle.textContent = groupName;
    groupTitle.style.cssText = `
            color: #ccc;
            margin: 0 0 8px 0;
            font-size: 1vw !important;
            border-bottom: 1px solid #555;
            padding-bottom: 3px;
            width: 20vw;
            height: 50%;
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
          // Format display based on step size - show decimals for fractional steps
          const displayValue = control.step < 1 ? value.toFixed(1) : value;
          valueDisplay.textContent = displayValue;
          console.log(`${control.property} set to:`, value);
        });

        rangeContainer.appendChild(input);
        rangeContainer.appendChild(valueDisplay);
        input = rangeContainer;
      }

      controlDiv.appendChild(label);
      controlDiv.appendChild(input);
      group.appendChild(controlDiv);
    });

    return group;
  }

  keyboard_shortcuts(e) {
    if (e.ctrlKey && e.key === "z") {
      this.canvas.undo();
    }

    if (e.ctrlKey && e.key === "y") {
      this.canvas.redo();
    }

    if (e.key === "1") {
      this.canvas.changeBrushSize(-8);
    } else if (e.key === "3") {
      this.canvas.changeBrushSize(8);
    } else if (e.key === "c") {
      this.canvas.switchColor();
    } else if (e.key === "b") {
      this.canvas.switchBrushMode();
    } else if (e.key === "m") {
      this.canvas.toggleMask();
    } else if (e.key === "h") {
      this.toggleUI();
    } else if (e.key === "p") {
      this.toggleParameterPanel();
    } else if (e.key === "e") {
      this.canvas.changeBrushSize(2);
    } else if (e.key === "q") {
      this.canvas.changeBrushSize(-2);
    } else if (e.key === "f") {
      this.canvas.resetMask();
    } else if (e.key === "+") {
      this.canvas.zoomIn();
    } else if (e.key === "-") {
      this.canvas.zoomOut();
    }
  }

  toggleUI() {
    if (this.container.style.display === "none") {
      this.container.style.display = "flex";
    } else {
      this.container.style.display = "none";
    }
  }

  toggleParameterPanel() {
    if (this.parameter_section) {
      if (this.parameter_section.style.display === "none") {
        this.parameter_section.style.display = "block";
      } else {
        this.parameter_section.style.display = "none";
      }
    }
  }

  async openImg() {
    document.getElementById("modal").style.display = "flex";
    const itemList = document.getElementById("item-list");
    while (itemList.firstChild) {
      itemList.removeChild(itemList.firstChild);
    }
    let img_list = await this.file_system.get_img_list();
    img_list.forEach((img_name) => {
      const btn = document.createElement("button");
      btn.className = "modal-button";
      btn.textContent = img_name;
      btn.onclick = async () => {
        let img_ok = await this.file_system.get_img(img_name);
        if (img_ok) {
          this.canvas.drawImage(this.file_system.opened_image);
        } else {
          console.warn("Image not found");
          return;
        }
        let correct_label = await this.file_system.get_corr_label(img_name);
        let label_ok = await this.file_system.get_label(correct_label);
        if (label_ok) {
          this.canvas.drawMask(this.file_system.opened_label);
        } else {
          console.warn("label not found");
          this.canvas.resetMask();
        }

        document.getElementById("modal").style.display = "none";
      };
      itemList.appendChild(btn);
    });
  }

  async uplaodImage(e) {
    // Store original button text
    const originalText = this.upload_img_btn.textContent;

    document.getElementById("file-input").click();
    document.getElementById("file-input").onchange = async (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        let successCount = 0;
        let failCount = 0;

        for (let file of files) {
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                let img_base64 = e.target.result;
                let img_ok = await this.file_system.upload_image(
                  img_base64,
                  file.name,
                );
                console.log(img_ok);

                if (img_ok) {
                  successCount++;
                } else {
                  failCount++;
                }

                // Update button with progress
                if (files.length > 1) {
                  this.upload_img_btn.textContent = `Uploaded ${successCount}/${files.length}`;
                } else {
                  this.upload_img_btn.textContent = "✅ Uploaded!";
                }
                this.upload_img_btn.style.backgroundColor = "#4caf50"; // Green

                // When all files are processed
                if (successCount + failCount === files.length) {
                  if (failCount > 0) {
                    this.upload_img_btn.textContent = `⚠️ ${successCount}/${files.length} Uploaded`;
                    this.upload_img_btn.style.backgroundColor = "#ff9800"; // Orange
                  }

                  // Reset button after delay
                  setTimeout(() => {
                    this.upload_img_btn.textContent = originalText;
                    this.upload_img_btn.style.backgroundColor = "";
                  }, 1500);
                }
              } catch (error) {
                console.error("Error uploading image:", error);
                failCount++;

                this.upload_img_btn.textContent = "❌ Failed!";
                this.upload_img_btn.style.backgroundColor = "#f44336"; // Red

                // Reset button after delay
                setTimeout(() => {
                  this.upload_img_btn.textContent = originalText;
                  this.upload_img_btn.style.backgroundColor = "";
                }, 1500);
              }
            };

            reader.onerror = (error) => {
              console.error("Error reading file:", error);
              failCount++;

              // Update button to show error
              this.upload_img_btn.textContent = "❌ Failed!";
              this.upload_img_btn.style.backgroundColor = "#f44336"; // Red

              // Reset button after delay
              setTimeout(() => {
                this.upload_img_btn.textContent = originalText;
                this.upload_img_btn.style.backgroundColor = "";
              }, 1500);
            };

            reader.readAsDataURL(file);
          }
        }
      }
    };
  }

  async uplaodLabel(e) {
    // Store original button text
    const originalText = this.upload_mask_btn.textContent;

    document.getElementById("file-input").click();
    document.getElementById("file-input").onchange = async (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        let successCount = 0;
        let failCount = 0;

        for (let file of files) {
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                let label_base64 = e.target.result;
                let label_ok = await this.file_system.upload_label(
                  label_base64,
                  file.name,
                );
                console.log(label_ok);

                if (label_ok) {
                  successCount++;
                } else {
                  failCount++;
                }

                // Update button with progress
                if (files.length > 1) {
                  this.upload_mask_btn.textContent = `Uploaded ${successCount}/${files.length}`;
                } else {
                  this.upload_mask_btn.textContent = "✅ Uploaded!";
                }
                this.upload_mask_btn.style.backgroundColor = "#4caf50"; // Green

                // When all files are processed
                if (successCount + failCount === files.length) {
                  if (failCount > 0) {
                    this.upload_mask_btn.textContent = `⚠️ ${successCount}/${files.length} Uploaded`;
                    this.upload_mask_btn.style.backgroundColor = "#ff9800"; // Orange
                  }

                  // Reset button after delay
                  setTimeout(() => {
                    this.upload_mask_btn.textContent = originalText;
                    this.upload_mask_btn.style.backgroundColor = "";
                  }, 1500);
                }
              } catch (error) {
                console.error("Error uploading mask:", error);
                failCount++;

                this.upload_mask_btn.textContent = "❌ Failed!";
                this.upload_mask_btn.style.backgroundColor = "#f44336"; // Red

                // Reset button after delay
                setTimeout(() => {
                  this.upload_mask_btn.textContent = originalText;
                  this.upload_mask_btn.style.backgroundColor = "";
                }, 1500);
              }
            };

            reader.onerror = (error) => {
              console.error("Error reading file:", error);
              failCount++;

              // Update button to show error
              this.upload_mask_btn.textContent = "❌ Failed!";
              this.upload_mask_btn.style.backgroundColor = "#f44336"; // Red

              // Reset button after delay
              setTimeout(() => {
                this.upload_mask_btn.textContent = originalText;
                this.upload_mask_btn.style.backgroundColor = "";
              }, 1500);
            };

            reader.readAsDataURL(file);
          }
        }
      }
    };
  }

  async saveLabel() {
    // Store original button text
    const originalText = this.save_btn.textContent;

    try {
      const mask_base64 = this.canvas.getMaskBase64();
      this.file_system.opened_label.src = mask_base64;
      let label_ok = await this.file_system.save_label();
      console.log("save label:", label_ok);

      // Show success message
      this.save_btn.textContent = "✅ Saved!";
      this.save_btn.style.backgroundColor = "#4caf50"; // Green
    } catch (error) {
      // Show failure message
      console.error("Error saving label:", error);
      this.save_btn.textContent = "❌ Failed!";
      this.save_btn.style.backgroundColor = "#f44336"; // Red
    }

    // Reset button text and style after a short delay
    setTimeout(() => {
      this.save_btn.textContent = originalText;
      this.save_btn.style.backgroundColor = ""; // Reset to default
    }, 1500); // 1.5 seconds
  }
}
