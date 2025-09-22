import { Canvas } from "./canvas.js";
import { UI } from "./ui.js";
import { FileSystem } from "./file_system.js";

let dataset_name = document.getElementById("dataset").textContent;
let canvas = new Canvas("mask-canvas", "image-canvas", "magic_pen_canvas");
let file_system = new FileSystem(dataset_name);
let ui = new UI("controls", canvas, file_system);
document.body.style.cursor = 'crosshair';