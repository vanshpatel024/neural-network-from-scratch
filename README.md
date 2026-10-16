# Neural Network From Scratch

A deep learning project implementing neural networks from first principles using pure Python and NumPy, paired with a web visualizer and textbook.

The goal is not to use a high-level framework like TensorFlow or PyTorch. Instead, every core component—matrix transformations, activations, losses, backpropagation, and mini-batch SGD—is built from scratch in Python.

---

## What This Project Includes

- **Core Python Engine**:
  - Dense layers with full forward and backward passes
  - Activation functions: Sigmoid, Tanh, ReLU, and Leaky ReLU with analytical derivatives
  - Loss functions: Mean Squared Error (MSE) and Binary Cross-Entropy (BCE)
  - Optimizers: Mini-batch Stochastic Gradient Descent (SGD)
  - End-to-end training loop on the 20x20 handwritten digit dataset (`dataset/01dataset.csv`)
- **Interactive Visual Textbook & Web Playground (`App/`)**:
  - 11 comprehensive visual chapters spanning Foundations, Learning, Training, and Live Playground
  - Interactive gradient checking demo and docs topic with finite difference validation and bug injection (the Python project does not include a gradient checker)
  - Interactive playground training on Moons, Circles, XOR, Blobs, and Spirals with ReLU, Sigmoid, Tanh, and Linear (Leaky ReLU appears in the Activation Functions chapter curve tool only)
  - Multi-threaded Web Worker training engine running at 60 FPS
  - Live 2D decision boundary canvas with interactive point additions
  - Real-time neuron feature maps showing what each hidden unit learns
  - Visual 2D contour simulations demonstrating descent and momentum damping concepts

---

## Running the Python Model

### 1. Setup

Install NumPy using `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 2. Train the Network

Run the training script from the project root:

```bash
python train.py
```

### 3. What It Does and Prints

The script loads the 20×20 handwritten digit dataset from `dataset/01dataset.csv`. It builds a 3-layer neural network (Dense 25 with ReLU, Dense 15 with ReLU, Dense 1 with Sigmoid) and trains it using mini-batch SGD.

During training, `model.py` prints the average loss every 100 epochs:

```text
Epoch 0 | Loss: 0.6931
Epoch 100 | Loss: 0.6812
...
Epoch 9900 | Loss: 0.0415
```

When training finishes, the script prints:

```text
Weights saved to model_weights.json
```

Warning: Running `train.py` overwrites `model_weights.json` in the root folder with new weights.

### 4. Copying Weights to the Web App

To load your trained weights into the web application, copy `model_weights.json` into `App/public/`:

```bash
# On Linux / macOS:
cp model_weights.json App/public/model_weights.json

# On Windows (PowerShell):
Copy-Item model_weights.json App/public/model_weights.json
```

---

## Running the Interactive Visualizer

The interactive guide lives in the `App/` directory:

```bash
cd App
npm install
npm run dev
```

Open `http://localhost:5173` to explore the interactive visual textbook.

For full architecture details, deployment options (Vercel & GitHub Pages), and developer scripts, see the [App Documentation](App/README.md).

---

## Deployment

The website deploys to Vercel as a single-page app. URL rewrites ensure `/docs` works on direct visits and refreshes.

- **Deploy from repository root**: Vercel reads the root `vercel.json`. It runs `cd App && npm install` and builds output to `App/dist`.
- **Deploy with Root Directory set to `App`**: In your Vercel Project Settings, set **Root Directory** to `App`. Vercel will use `App/vercel.json` directly.

---

## Running the Quality Gates

Inside the `App/` directory:

```bash
npm test              # Run unit tests (Vitest)
npm run typecheck     # Type-check TypeScript (tsc --noEmit)
npm run lint          # Run ESLint
npm run check:language# Audit reading grade level (Grade <= 8.0)
npm run test:e2e      # Run Playwright navigation tests
npm run build         # Build production bundle
```
