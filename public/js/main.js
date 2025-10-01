import { Canvas } from "./canvas.js";
import { UI } from "./ui.js";
import { FileSystem } from "./file_system.js";
import { Settings } from "./settings.js";

let dataset_name = document.getElementById("dataset").textContent;
let canvas = new Canvas(
  "mask-canvas",
  "image-canvas",
  "magic_pen_canvas",
  "mask-preview-canvas",
);
let file_system = new FileSystem(dataset_name);
let settings = new Settings(canvas);
let ui = new UI("controls", canvas, file_system, settings);
document.body.style.cursor = "crosshair";
