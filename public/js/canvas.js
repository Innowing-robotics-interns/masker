const log = console.log;
export class Canvas {
  constructor(
    mask_canvas_ID,
    image_canvas_ID,
    magic_pen_canvas_ID,
    mask_preview_canvas_ID,
  ) {
    // draw mode properties
    this.foreground_color = "rgb(255, 255, 255)"; // White
    this.background_color = "rgb(0, 0, 0)"; // Black
    this.draw_size = 5;

    // mask display properties
    this.mask_display_color = "rgb(255, 0, 0)"; // Red is default

    // magic_pen mode properties
    this.crop_size = 200;
    this.magic_pen_size = this.crop_size / 2; // Magic pen size is half of crop size
    this.magic_pen_color = "rgba(255, 0, 255, 1)"; // Semi-transparent magenta
    this.crop_every_len = 200;

    this.line_len = 0;
    this.crops = [];
    this.predict_mode = "normal";

    // zoom properties
    this.zoom_level = 1.0;
    this.min_zoom = 0.2;
    this.max_zoom = 5.0;
    this.zoom_step = 0.1;

    // morphology properties
    this.apply_morphology = true; // Whether to apply morphological filtering
    this.morph_kernel_size = 3; // Size of the kernel for morphological operations
    this.morph_iterations = 2; // Number of iterations for morphological operations

    // DBSCAN properties
    this.apply_dbscan = true; // Whether to apply DBSCAN clustering
    this.db_eps = 10; // DBSCAN epsilon parameter (distance threshold)
    this.db_min_samples = 5; // DBSCAN minimum samples parameter

    // Sensitivity properties
    this.sensitivity = 2; // Sensitivity threshold parameter

    // brush properties
    this.brush_mode = "draw";
    this.color = this.foreground_color;
    this.brush_width = this.draw_size;
    this.brush_spacing = 1;
    this.drawing = false;
    this.last_pos = false;

    // Window properties
    this.dragging = false;
    this.window_lastX;
    this.window_lastY;

    // Canvas dimensions
    this.canvas_width;
    this.canvas_height;
    this.img_w;
    this.img_h;

    // History management
    this.past = [];
    this.future = [];
    this.history_size = 20;

    // Canvas elements and contexts
    this.mask_canvas = document.getElementById(mask_canvas_ID);
    this.mask_ctx = this.mask_canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.mask_ctx.globalCompositeOperation = "source-over";

    this.mask_preview_canvas = document.getElementById(mask_preview_canvas_ID);
    this.mask_preview_ctx = this.mask_preview_canvas.getContext("2d", {
      willReadFrequently: true,
    });

    this.img_canvas = document.getElementById(image_canvas_ID);
    this.img_ctx = this.img_canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.magic_pen_canvas = document.getElementById(magic_pen_canvas_ID);
    this.magic_pen_ctx = this.magic_pen_canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.magic_pen_ctx.strokeStyle = this.magic_pen_color;
    this.magic_pen_ctx.fillStyle = this.magic_pen_color;

    // Make mask_canvas focusable to receive keyboard events
    this.mask_canvas.tabIndex = 1000;
    this.addListeners();

    // Initialize custom cursor
    this.updateCustomCursor();
  }

  // ============================================================
  // Event Handling and Initialization
  // ============================================================

  addListeners() {
    this.mask_canvas.addEventListener("mousedown", (e) => {
      this.mouseDown(e);
      this.dragDown(e);
    });
    this.mask_canvas.addEventListener("mousemove", (e) => {
      this.mouseMove(e);
      this.dragMove(e);
    });
    this.mask_canvas.addEventListener("mouseup", (e) => {
      this.mouseUp(e);
      this.dragUp(e);
    });
    this.mask_canvas.addEventListener("mouseleave", (e) => {
      this.mouseLeave(e);
    });
    this.mask_canvas.addEventListener("mouseover", () => {
      this.updateCustomCursor(); // Use custom cursor instead of default
    });
    this.mask_canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent the context menu from appearing
      this.storeState();
      this.floodFill(...this.getMouseXY(e), this.color, 254);
    });
    this.mask_canvas.addEventListener("wheel", () => {
      this.updateCustomCursor(); // Update cursor on zoom
    });
  }

  add_event_listener(event, callback) {
    this.mask_canvas.addEventListener(event, callback);
    this.mask_canvas.addEventListener("magicPenCrop", (event) => {
      const crop = event.detail.crop;
      console.log(`New crop created at (${crop.centerX}, ${crop.centerY})`);
    });
  }

  mouseLeave(e) {
    this.mouseUp(e);
    this.drawing = false;
    this.last_pos = false;
    this.dragging = false;
    document.body.style.cursor = "default"; // Reset cursor to default
  }

  mouseDown(e) {
    if (e.button === 0) {
      if (this.brush_mode === "draw") {
        this.storeState();
        this.drawing = true;
        let [x, y] = this.getMouseXY(e);
        this.drawPoint(x, y, this.mask_ctx);
        this.last_pos = [x, y];
      } else if (this.brush_mode === "magic_pen") {
        this.clear_magic_pen();
        this.drawing = true;
        this.line_len = 0;

        // Ensure magic pen context is properly set
        this.magic_pen_ctx.fillStyle = this.magic_pen_color;
        this.magic_pen_ctx.strokeStyle = this.magic_pen_color;

        let [x, y] = this.getMouseXY(e);
        this.drawPoint(x, y, this.magic_pen_ctx);
        this.last_pos = [x, y];
      }
    }
  }

  mouseUp(e) {
    if (e.button === 0) {
      if (this.brush_mode === "draw") {
        this.drawing = false;
        this.last_pos = false;
        this.removeGray();
      } else if (this.brush_mode === "magic_pen" && this.drawing) {
        this.drawing = false;
        this.last_pos = false;
        this.sendCropsForPrediction()
          .then((results) => {
            // Handle the predicted crops
            console.log("Predicted crops:", results);
            this.clear_magic_pen();
            this.clearCrops();
          })
          .catch((error) => {
            console.error("Error predicting crops:", error);
            this.clear_magic_pen();
            this.clearCrops();
          });
      }
    }
  }

  mouseMove(e) {
    const now = Date.now();
    if (now - this.lastDraw < 20) return; // Only draw every
    this.lastDraw = now;
    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();

      if (this.drawing && this.brush_mode === "draw") {
        let [x, y] = this.getMouseXY(e);
        this.drawPoint(x, y, this.mask_ctx);
        this.last_pos = [x, y];
      } else if (this.drawing && this.brush_mode === "magic_pen") {
        let [x, y] = this.getMouseXY(e);
        this.drawPoint(x, y, this.magic_pen_ctx);
        this.last_pos = [x, y];
      }
    }
  }

  getMouseXY(e) {
    let rect = e.target.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    x = (x / rect.width) * this.canvas_width;
    y = (y / rect.height) * this.canvas_height;

    return [x, y];
  }

  dragDown(e) {
    if (e.button === 1) {
      // Middle mouse button
      e.preventDefault();
      this.dragging = true;
      let [x, y] = [e.clientX, e.clientY];
      this.lastX = x;
      this.lastY = y;
    }
  }

  dragMove(e) {
    if (this.dragging) {
      let [x, y] = [e.clientX, e.clientY];
      const dx = x - this.lastX;
      const dy = y - this.lastY;
      window.scrollBy(-dx, -dy);
      this.lastX = x;
      this.lastY = y;
    }
  }

  dragUp(e) {
    if (e.button === 1) {
      this.dragging = false;
    }
  }

  // ============================================================
  // Custom Cursor
  // ============================================================

  updateCustomCursor() {
    const size = Math.max(this.brush_width * this.zoom_level * 2, 8);

    if (size > 128 || this.brush_mode === "magic_pen") {
      // Draw colored crosshair for large cursors
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 21;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle =
        this.brush_mode === "magic_pen"
          ? this.magic_pen_color
          : this.mask_display_color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10.5, 0);
      ctx.lineTo(10.5, 21);
      ctx.moveTo(0, 10.5);
      ctx.lineTo(21, 10.5);
      ctx.stroke();
      this.mask_canvas.style.cursor = `url(${canvas.toDataURL()}) 10 10, auto`;
    } else {
      // Draw circle cursor
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const half = size / 2;
      ctx.strokeStyle = this.mask_display_color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(half, half, half - 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = this.mask_display_color;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      this.mask_canvas.style.cursor = `url(${canvas.toDataURL()}) ${half} ${half}, auto`;
    }
  }

  // ============================================================
  // Image and Mask Functions
  // ============================================================

  drawImage(img) {
    this.img_canvas.width = img.width;
    this.img_canvas.height = img.height;
    this.mask_canvas.width = img.width;
    this.mask_canvas.height = img.height;
    this.mask_preview_canvas.width = img.width;
    this.mask_preview_canvas.height = img.height;
    this.magic_pen_canvas.width = img.width;
    this.magic_pen_canvas.height = img.height;
    this.img_ctx.clearRect(0, 0, img.width, img.height);
    this.mask_ctx.clearRect(0, 0, img.width, img.height);
    this.mask_preview_ctx.clearRect(0, 0, img.width, img.height);
    this.magic_pen_ctx.clearRect(0, 0, img.width, img.height);

    this.canvas_width = img.width;
    this.canvas_height = img.height;

    this.img_ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
    this.img_ctx.drawImage(img, 0, 0, this.canvas_width, this.canvas_height);

    // Apply current zoom level to display
    this.updateCanvasDisplay();
  }

  drawMask(mask) {
    if (!mask || mask.src == null || mask.src == "") {
      // No mask present, start with black
      this.mask_ctx.fillStyle = "black";
      this.mask_ctx.fillRect(0, 0, this.canvas_width, this.canvas_height);
    } else {
      this.mask_ctx.drawImage(
        mask,
        0,
        0,
        this.canvas_width,
        this.canvas_height,
      );
    }
    this.updateMaskPreview();
  }

  toggleMask() {
    this.mask_canvas.classList.toggle("hidden");
  }

  resetMask() {
    this.storeState();
    this.drawMask(null);
  }

  getMaskBase64() {
    return this.mask_canvas.toDataURL("image/png");
  }

  cropImageBase64(centerX, centerY, cropWidth, cropHeight) {
    // Calculate the top-left corner from center coordinates
    const startX = Math.floor(centerX - cropWidth / 2);
    const startY = Math.floor(centerY - cropHeight / 2);

    // Ensure coordinates are within canvas bounds
    const clampedStartX = Math.max(0, startX);
    const clampedStartY = Math.max(0, startY);
    const clampedEndX = Math.min(this.canvas_width, startX + cropWidth);
    const clampedEndY = Math.min(this.canvas_height, startY + cropHeight);

    // Calculate actual crop dimensions (might be smaller if near edges)
    const actualCropWidth = clampedEndX - clampedStartX;
    const actualCropHeight = clampedEndY - clampedStartY;

    // Create a temporary canvas for the crop
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropWidth; // Use requested dimensions
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext("2d");

    // Fill with black background (in case crop extends beyond canvas)
    cropCtx.fillStyle = "rgb(0, 0, 0)";
    cropCtx.fillRect(0, 0, cropWidth, cropHeight);

    // Calculate offset to center the actual crop in the output canvas
    const offsetX = (cropWidth - actualCropWidth) / 2;
    const offsetY = (cropHeight - actualCropHeight) / 2;

    // Extract the crop region from the image canvas
    if (this.img_ctx && actualCropWidth > 0 && actualCropHeight > 0) {
      const imageData = this.img_ctx.getImageData(
        clampedStartX,
        clampedStartY,
        actualCropWidth,
        actualCropHeight,
      );

      // Create a temporary canvas to hold the cropped image data
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = actualCropWidth;
      tempCanvas.height = actualCropHeight;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.putImageData(imageData, 0, 0);

      // Draw the cropped image onto the final canvas, centered
      cropCtx.drawImage(
        tempCanvas,
        0,
        0,
        actualCropWidth,
        actualCropHeight, // Source
        offsetX,
        offsetY,
        actualCropWidth,
        actualCropHeight, // Destination
      );
    }

    // Convert to base64 and return
    return {
      img: cropCanvas.toDataURL("image/png"),
      centerX: centerX,
      centerY: centerY,
      width: cropWidth,
      height: cropHeight,
    };
  }

  replaceMaskRegionWithImage(x, y, width, height, image) {
    // Clip to ensure we don't try to replace outside the mask_canvas
    const clipX = Math.max(0, x);
    const clipY = Math.max(0, y);
    const clipWidth = Math.min(width, this.canvas_width - clipX);
    const clipHeight = Math.min(height, this.canvas_height - clipY);

    if (clipWidth <= 0 || clipHeight <= 0) return;

    // Create a temporary mask_canvas to process the image
    const tempCanvas = document.createElement("mask_canvas");
    tempCanvas.width = clipWidth;
    tempCanvas.height = clipHeight;
    const tempCtx = tempCanvas.getContext("2d");

    // Draw the crop image onto the temporary mask_canvas, scaling if necessary
    tempCtx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      0,
      0,
      clipWidth,
      clipHeight,
    );

    // Get the pixel data
    const imageData = tempCtx.getImageData(0, 0, clipWidth, clipHeight);

    // Apply to the mask mask_canvas
    this.mask_ctx.putImageData(imageData, clipX, clipY);
    this.updateMaskPreview();

    // If we have auto-thresholding, apply it
    this.removeGray();
  }

  // ============================================================
  // Drawing and Painting Functions
  // ============================================================

  drawPoint(x, y, ctx) {
    // Linear interpolation from last point
    if (this.last_pos) {
      let [x0, y0] = this.last_pos;
      let d = this.dist(x0, y0, x, y);
      this.line_len += d;
      if (d > this.brush_spacing) {
        let spacing_ratio = this.brush_spacing / d;
        let spacing_ratio_total = spacing_ratio;
        while (spacing_ratio_total <= 1) {
          let xn = x0 + spacing_ratio_total * (x - x0);
          let yn = y0 + spacing_ratio_total * (y - y0);

          // Draw at the interpolated point
          this.drawCircle(xn, yn, this.brush_width, ctx);

          // Magic pen mode: crop at regular intervals
          if (this.brush_mode === "magic_pen" && ctx === this.magic_pen_ctx) {
            this.handleMagicPenCropping(xn, yn);
          }

          spacing_ratio_total += spacing_ratio;
        }
      } else {
        this.drawCircle(x, y, this.brush_width, ctx);

        // Magic pen mode: crop at current point
        if (this.brush_mode === "magic_pen" && ctx === this.magic_pen_ctx) {
          this.handleMagicPenCropping(x, y);
        }
      }
    } else {
      this.drawCircle(x, y, this.brush_width, ctx);

      // Magic pen mode: crop at starting point
      if (this.brush_mode === "magic_pen" && ctx === this.magic_pen_ctx) {
        this.handleMagicPenCropping(x, y);
      }
    }
  }

  drawCircle(x, y, width, ctx) {
    // Set the correct fill and stroke style based on the context
    if (ctx === this.magic_pen_ctx) {
      ctx.fillStyle = this.magic_pen_color;
      ctx.strokeStyle = this.magic_pen_color;
    } else {
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;
    }

    ctx.beginPath();
    ctx.imageSmoothingEnabled = false;
    ctx.arc(x, y, width, 0, 2 * Math.PI);
    ctx.fill();

    // If drawing on mask canvas, also draw to preview canvas in real-time
    if (ctx === this.mask_ctx && this.brush_mode === "draw") {
      this.mask_preview_ctx.fillStyle = this.mask_display_color;
      this.mask_preview_ctx.strokeStyle = this.mask_display_color;
      this.mask_preview_ctx.beginPath();
      this.mask_preview_ctx.imageSmoothingEnabled = false;
      this.mask_preview_ctx.arc(x, y, width, 0, 2 * Math.PI);
      this.mask_preview_ctx.fill();
    }
  }

  dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  switchColor() {
    if (this.brush_mode === "draw") {
      if (this.color === this.foreground_color) {
        this.color = this.background_color;
      } else {
        this.color = this.foreground_color;
      }
    } else if (this.brush_mode === "magic_pen") {
      this.color = this.magic_pen_color;
    }
    this.updateCustomCursor(); // Update cursor to match new color
  }

  switchBrushMode() {
    if (this.brush_mode === "draw") {
      this.brush_mode = "magic_pen";
      this.draw_size = this.brush_width; // Store current draw size
      this.brush_width = this.magic_pen_size;
      this.updateCustomCursor();
    } else if (this.brush_mode === "magic_pen") {
      this.brush_mode = "draw";
      this.brush_width = this.draw_size; // Reset brush width for drawing
      this.updateCustomCursor();
    }
    this.switchColor(); // Switch color when changing brush mode
    this.updateCustomCursor(); // Update cursor to match new brush mode
    log(`Switched brush mode to: ${this.brush_mode}`);
  }

  changeBrushSize(size) {
    if (this.brush_mode === "draw") {
      if (this.brush_width + size < 1) {
        return; // Prevent brush size from going below 1
      }
      this.draw_size += size;
      this.brush_width = this.draw_size; // Update brush width to match draw size
    } else if (this.brush_mode === "magic_pen") {
      if (this.crop_size + size < 128 || this.crop_size + size > 512) {
        return; // Prevent magic pen size from going below 128 or above 512
      }
      this.crop_size += size;
      this.crop_every_len = this.crop_size / 2; // Update crop interval to match new crop size
      this.magic_pen_size = this.crop_size / 2; // Update magic pen size to match crop size
      this.brush_width = this.magic_pen_size;
    }
    this.updateCustomCursor(); // Update cursor to match new size
  }

  clear_magic_pen() {
    this.magic_pen_ctx.clearRect(
      0,
      0,
      this.magic_pen_canvas.width,
      this.magic_pen_canvas.height,
    );
    this.magic_pen_ctx.fillStyle = this.magic_pen_color;
    this.magic_pen_ctx.strokeStyle = this.magic_pen_color;
  }

  removeGray() {
    let imageData = this.mask_ctx.getImageData(
      0,
      0,
      this.mask_ctx.canvas.width,
      this.mask_ctx.canvas.height,
    );
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Simple threshold: if closer to white, set to white; else black
      let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg > 127) {
        data[i] = data[i + 1] = data[i + 2] = 255;
      } else {
        data[i] = data[i + 1] = data[i + 2] = 0;
      }
    }
    this.mask_ctx.putImageData(imageData, 0, 0);
    this.updateMaskPreview();
  }

  updateMaskPreview() {
    // Clear the preview canvas
    this.mask_preview_ctx.clearRect(
      0,
      0,
      this.mask_preview_canvas.width,
      this.mask_preview_canvas.height,
    );

    // Get mask data
    let maskData = this.mask_ctx.getImageData(
      0,
      0,
      this.mask_canvas.width,
      this.mask_canvas.height,
    );
    let previewData = this.mask_preview_ctx.createImageData(
      this.mask_canvas.width,
      this.mask_canvas.height,
    );

    // Parse display color
    let colorMatch = this.mask_display_color.match(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/,
    );
    let displayR = parseInt(colorMatch[1]);
    let displayG = parseInt(colorMatch[2]);
    let displayB = parseInt(colorMatch[3]);

    // Convert mask to colored preview
    for (let i = 0; i < maskData.data.length; i += 4) {
      let isWhite = maskData.data[i] > 127; // Check if mask pixel is white (foreground)

      if (isWhite) {
        // Show as display color
        previewData.data[i] = displayR;
        previewData.data[i + 1] = displayG;
        previewData.data[i + 2] = displayB;
        previewData.data[i + 3] = 255; // Opaque
      } else {
        // Transparent (background)
        previewData.data[i] = 0;
        previewData.data[i + 1] = 0;
        previewData.data[i + 2] = 0;
        previewData.data[i + 3] = 0; // Transparent
      }
    }

    this.mask_preview_ctx.putImageData(previewData, 0, 0);
  }

  setMaskDisplayColor(color) {
    this.mask_display_color = color;
    this.updateMaskPreview();
    this.updateCustomCursor();
  }

  floodFill(x, y, fillColor, tolerance = 254) {
    // Get image data
    const imageData = this.mask_ctx.getImageData(
      0,
      0,
      this.mask_ctx.canvas.width,
      this.mask_ctx.canvas.height,
    );
    const data = imageData.data;
    const width = this.mask_ctx.canvas.width;
    const height = this.mask_ctx.canvas.height;

    // Convert fillColor to RGBA array
    let fillR, fillG, fillB, fillA;
    if (fillColor === "rgb(255, 255, 255)") {
      [fillR, fillG, fillB, fillA] = [255, 255, 255, 255];
    } else if (fillColor === "rgb(0, 0, 0)") {
      [fillR, fillG, fillB, fillA] = [0, 0, 0, 255];
    } else {
      [fillR, fillG, fillB, fillA] = [255, 255, 255, 255];
    }

    // Get the starting pixel color
    const startX = Math.floor(x);
    const startY = Math.floor(y);
    const startIdx = (startY * width + startX) * 4;
    const startColor = [
      data[startIdx],
      data[startIdx + 1],
      data[startIdx + 2],
      data[startIdx + 3],
    ];

    // If the fill color is the same as the start color, do nothing
    if (
      startColor[0] === fillR &&
      startColor[1] === fillG &&
      startColor[2] === fillB &&
      startColor[3] === fillA
    ) {
      return;
    }

    // Helper to compare pixel color with tolerance
    function matchColor(idx) {
      return (
        Math.abs(data[idx] - startColor[0]) <= tolerance &&
        Math.abs(data[idx + 1] - startColor[1]) <= tolerance &&
        Math.abs(data[idx + 2] - startColor[2]) <= tolerance &&
        Math.abs(data[idx + 3] - startColor[3]) <= tolerance
      );
    }

    // Helper to set pixel color
    function setColor(idx) {
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;
    }

    // Optimized scanline flood fill
    const stack = [[startX, startY]];
    while (stack.length > 0) {
      let [x, y] = stack.pop();
      let idx = (y * width + x) * 4;

      // Move to the leftmost pixel in this scanline
      while (x >= 0 && matchColor(idx)) {
        x--;
        idx -= 4;
      }
      x++;
      idx += 4;

      let spanAbove = false;
      let spanBelow = false;

      // Fill rightwards and check above/below
      while (x < width && matchColor(idx)) {
        setColor(idx);

        // Check pixel above
        if (y > 0) {
          const aboveIdx = ((y - 1) * width + x) * 4;
          if (matchColor(aboveIdx)) {
            if (!spanAbove) {
              stack.push([x, y - 1]);
              spanAbove = true;
            }
          } else if (spanAbove) {
            spanAbove = false;
          }
        }

        // Check pixel below
        if (y < height - 1) {
          const belowIdx = ((y + 1) * width + x) * 4;
          if (matchColor(belowIdx)) {
            if (!spanBelow) {
              stack.push([x, y + 1]);
              spanBelow = true;
            }
          } else if (spanBelow) {
            spanBelow = false;
          }
        }

        x++;
        idx += 4;
      }
    }

    // Update the canvas
    this.mask_ctx.putImageData(imageData, 0, 0);
    this.updateMaskPreview();
  }

  // ============================================================
  // History Management (Undo/Redo)
  // ============================================================

  storeState() {
    this.past.push(
      this.mask_ctx.getImageData(0, 0, this.canvas_width, this.canvas_height),
    );
    if (this.past.length > this.history_size) {
      // Remove the first element (oldest state)
      this.past.shift();
    }

    if (this.future.length > 0) {
      // Reset future array to remove all redos
      this.future = [];
    }
  }

  undo() {
    if (this.past.length > 0) {
      // Save the current state for redo
      let current_state = this.mask_ctx.getImageData(
        0,
        0,
        this.canvas_width,
        this.canvas_height,
      );
      this.future.push(current_state);
      // Reload the this.past state
      let past_state = this.past.pop();
      this.mask_ctx.putImageData(past_state, 0, 0);
      this.updateMaskPreview();
    }
  }

  redo() {
    if (this.future.length > 0) {
      // Save the current state for undo
      let current_state = this.mask_ctx.getImageData(
        0,
        0,
        this.canvas_width,
        this.canvas_height,
      );
      this.past.push(current_state);
      // Reload the past state
      let state = this.future.pop();
      this.mask_ctx.putImageData(state, 0, 0);
      this.updateMaskPreview();
    }
  }

  // ============================================================
  // Magic Pen Cropping Functions
  // ============================================================

  handleMagicPenCropping(x, y) {
    // Check if we should create a crop at this distance
    x = Math.floor(x);
    y = Math.floor(y);
    if (this.line_len >= this.crop_every_len * this.crops.length) {
      this.createCropAtPosition(x, y);
      log(
        `Created crop ${this.crops.length} at position (${x}, ${y}) after ${this.line_len} pixels`,
      );
    }
  }

  createCropAtPosition(centerX, centerY) {
    try {
      // Create a crop using the existing cropImageBase64 method
      const cropData = this.cropImageBase64(
        centerX,
        centerY,
        this.crop_size,
        this.crop_size,
      );

      // Add to crops array with additional metadata
      const crop = {
        id: this.crops.length,
        image_base64: cropData.img,
        centerX: centerX,
        centerY: centerY,
        width: this.crop_size,
        height: this.crop_size,
        canvas_width: this.canvas_width,
        canvas_height: this.canvas_height,
        timestamp: Date.now(),
        line_distance: this.line_len,
      };

      this.crops.push(crop);

      // Optional: Trigger a custom event that other parts of the application can listen to
      this.dispatchCropEvent(crop);

      return crop;
    } catch (error) {
      console.error("Error creating crop at position:", error);
      return null;
    }
  }

  dispatchCropEvent(crop) {
    // Create and dispatch a custom event that other parts of the app can listen to
    const cropEvent = new CustomEvent("magicPenCrop", {
      detail: {
        crop: crop,
        totalCrops: this.crops.length,
        canvasInstance: this,
      },
    });

    // Dispatch on the mask canvas element
    this.mask_canvas.dispatchEvent(cropEvent);

    // Also dispatch on document for global listeners
    document.dispatchEvent(cropEvent);
  }

  getCrops() {
    return this.crops;
  }

  clearCrops() {
    this.crops = [];
    log("Cleared all magic pen crops");
  }

  getLastCrop() {
    return this.crops.length > 0 ? this.crops[this.crops.length - 1] : null;
  }

  // ============================================================
  // Magic Pen Prediction Functions
  // ============================================================

  async sendCropsForPrediction() {
    /**
     * Send all collected crops to the server for prediction
     * Returns the merged prediction mask
     */
    if (this.crops.length === 0) {
      console.warn("No crops to send for prediction");
      return null;
    }

    try {
      log(`Sending ${this.crops.length} crops for prediction...`);
      const response = await fetch("/magic_pen/predict_crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crops: this.crops,
          mode: this.predict_mode,
          apply_morphology: this.apply_morphology,
          morph_kernel_size: this.morph_kernel_size,
          morph_iterations: this.morph_iterations,
          apply_dbscan: this.apply_dbscan,
          db_eps: this.db_eps,
          db_min_samples: this.db_min_samples,
          sensitivity: this.sensitivity,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        console.log(
          `Successfully processed ${result.num_crops_processed} crops`,
        );

        // Optionally apply the merged prediction to the mask canvas
        if (result.merged_mask_base64) {
          await this.applyPredictionToMask(result.merged_mask_base64);
        }

        return result;
      } else {
        throw new Error(result.message || "Prediction failed");
      }
    } catch (error) {
      console.error("Error sending crops for prediction:", error);
      throw error;
    }
  }

  async applyPredictionToMask(maskBase64) {
    /**
     * Apply the predicted mask to the canvas, only applying white pixels
     * @param {string} maskBase64 - Base64 encoded mask image
     */
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Store current state for undo
        this.storeState();

        // Create a temporary canvas to process the prediction
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = this.canvas_width;
        tempCanvas.height = this.canvas_height;
        const tempCtx = tempCanvas.getContext("2d");

        // Draw the prediction image to the temporary canvas
        tempCtx.drawImage(img, 0, 0, this.canvas_width, this.canvas_height);

        // Get image data from both the prediction and current mask
        const predictionData = tempCtx.getImageData(
          0,
          0,
          this.canvas_width,
          this.canvas_height,
        );
        const currentMaskData = this.mask_ctx.getImageData(
          0,
          0,
          this.canvas_width,
          this.canvas_height,
        );

        const predictionPixels = predictionData.data;
        const maskPixels = currentMaskData.data;

        // Only apply white pixels from prediction to the mask
        for (let i = 0; i < predictionPixels.length; i += 4) {
          // Check if the prediction pixel is white (or close to white)
          const r = predictionPixels[i];
          const g = predictionPixels[i + 1];
          const b = predictionPixels[i + 2];

          // Consider a pixel "white" if all RGB values are above a threshold (e.g., 200)
          const isWhite = r > 200 && g > 200 && b > 200;

          if (isWhite) {
            // Apply white pixel to the mask
            maskPixels[i] = 255; // Red
            maskPixels[i + 1] = 255; // Green
            maskPixels[i + 2] = 255; // Blue
            maskPixels[i + 3] = 255; // Alpha
          }
          // If not white, keep the existing mask pixel (don't change anything)
        }

        // Apply the modified mask data back to the canvas
        this.mask_ctx.putImageData(currentMaskData, 0, 0);
        this.updateMaskPreview();

        // Apply threshold to ensure binary mask
        this.removeGray();

        console.log("Applied white pixels from prediction mask to canvas");
        resolve();
      };
      img.onerror = () => {
        console.error("Failed to load prediction mask image");
        reject(new Error("Failed to load prediction mask"));
      };
      img.src = maskBase64;
    });
  }

  async sendSingleCropForPrediction(crop) {
    /**
     * Send a single crop for prediction (for testing)
     * @param {Object} crop - Crop object to send
     */
    try {
      const response = await fetch("/magic_pen/predict_single_crop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: crop.image_base64,
          centerX: crop.centerX,
          centerY: crop.centerY,
          width: crop.width,
          height: crop.height,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        console.log("Single crop prediction completed");
        return result;
      } else {
        throw new Error(result.message || "Single crop prediction failed");
      }
    } catch (error) {
      console.error("Error sending single crop for prediction:", error);
      throw error;
    }
  }

  // ============================================================
  // Zoom Functions
  // ============================================================

  zoomIn() {
    const newZoom = Math.min(this.zoom_level + this.zoom_step, this.max_zoom);
    this.setZoom(newZoom);
    this.updateCustomCursor();
  }

  zoomOut() {
    const newZoom = Math.max(this.zoom_level - this.zoom_step, this.min_zoom);
    this.setZoom(newZoom);
    this.updateCustomCursor();
  }

  setZoom(zoomLevel) {
    // Get viewport center before zoom change
    const viewportCenterX = window.scrollX + window.innerWidth / 2;
    const viewportCenterY = window.scrollY + window.innerHeight / 2;

    // Get container position to calculate relative coordinates
    const container = document.getElementById("container");
    const containerRect = container.getBoundingClientRect();
    const containerX = containerRect.left + window.scrollX;
    const containerY = containerRect.top + window.scrollY;

    // Calculate point in canvas coordinates (before zoom)
    const canvasPointX = (viewportCenterX - containerX) / this.zoom_level;
    const canvasPointY = (viewportCenterY - containerY) / this.zoom_level;

    this.zoom_level = zoomLevel;
    this.updateCanvasDisplay();

    // Calculate new scroll position to keep the same canvas point centered
    const newContainerX = containerX; // Container position doesn't change
    const newContainerY = containerY;
    const newPointX = newContainerX + canvasPointX * this.zoom_level;
    const newPointY = newContainerY + canvasPointY * this.zoom_level;

    // Scroll to keep the point centered
    const newScrollX = newPointX - window.innerWidth / 2;
    const newScrollY = newPointY - window.innerHeight / 2;

    window.scrollTo(newScrollX, newScrollY);
  }

  updateCanvasDisplay() {
    // Calculate new display dimensions
    const displayWidth = this.canvas_width * this.zoom_level;
    const displayHeight = this.canvas_height * this.zoom_level;

    // Update CSS dimensions for all canvases to scale them
    this.img_canvas.style.width = `${displayWidth}px`;
    this.img_canvas.style.height = `${displayHeight}px`;
    this.mask_canvas.style.width = `${displayWidth}px`;
    this.mask_canvas.style.height = `${displayHeight}px`;
    this.magic_pen_canvas.style.width = `${displayWidth}px`;
    this.magic_pen_canvas.style.height = `${displayHeight}px`;
    this.mask_preview_canvas.style.width = `${displayWidth}px`;
    this.mask_preview_canvas.style.height = `${displayHeight}px`;

    // Update the container size to match
    const container = document.getElementById("container");
    if (container) {
      container.style.width = `${displayWidth}px`;
      container.style.height = `${displayHeight}px`;
    }
  }

  resetZoom() {
    this.setZoom(1.0);
  }
}
