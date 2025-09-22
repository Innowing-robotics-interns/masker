# Masker

## Description

This is the repo for the web tool for labeling datasets with binary masks

## Getting Started

1. Install [miniconda](https://www.anaconda.com/docs/getting-started/miniconda/install#using-miniconda-in-a-commercial-setting)

2. Run the following commands

```bash
# create a new environment
conda env create -f environment.yml

# activate environment
conda activate masker

# run app
python app.py
```

You should see the following printed in the terminal

    Using device: cpu
    Using device: cpu
    * Serving Flask app 'app'
    * Debug mode: on
    WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
    * Running on all addresses (0.0.0.0)
    * Running on http://127.0.0.1:8000
    * Running on http://10.68.152.106:8000

3. Control click on the http://127.0.0.1:8000 to start the app. Make sure to use a chromium based browser.

---

## Project Structure

```
masker/
├── environment.yml        # Conda environment (dependencies)
├── app.py                 # main Flask application and routes
├── predictor.py           # model inference logic wrapper
├── magic_pen_router.py    # blueprint for magic-pen mask editing
├── datasets/              # user data (each subfolder has images/ and labels/)
├── model/                 # model architectures:
├── public/                # static assets at /static:
│   ├── css/main.css       # styles
│   └── js/                # scripts:
│       ├── canvas.js      # drawing logic
│       ├── file_system.js # I/O helpers
│       ├── ui.js          # UI controls
│       └── main.js        # app entry point
└── templates/             # Jinja2 HTML views:
    ├── select_dataset.html # dataset picker
    └── index.html          # masking interface
```
