# Neural Network From Scratch

A deep learning project implementing neural networks from first principles using pure Python and NumPy, paired with an interactive visual textbook and playground.

Live Application: [https://neural-network-from-scratch-eight.vercel.app](https://neural-network-from-scratch-eight.vercel.app)

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
  - Live deployment at [neural-network-from-scratch-eight.vercel.app](https://neural-network-from-scratch-eight.vercel.app)
  - Interactive digit classifier running trained model weights
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

The script loads the 20x20 handwritten digit dataset from `dataset/01dataset.csv`. It builds a 3-layer neural network (Dense 25 with ReLU, Dense 15 with ReLU, Dense 1 with Sigmoid) and trains it using mini-batch SGD.

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

### 4. Testing Your Trained Weights

If you train the network with different parameters, you can test your weights directly in the web app:

1. Open the live application at [neural-network-from-scratch-eight.vercel.app](https://neural-network-from-scratch-eight.vercel.app).
2. Locate the **Use your own weights** panel under the digit canvas.
3. Upload or drag and drop your saved `model_weights.json` file.
4. The web app loads your custom weights and runs digit predictions in real time.

---

## About the Web Application (`App/`)

The `App/` directory contains the source code for the interactive visual textbook and playground. You can access the deployed application directly at [neural-network-from-scratch-eight.vercel.app](https://neural-network-from-scratch-eight.vercel.app).

It includes:
- A browser-based neural network engine written in TypeScript
- An interactive digit classifier that runs inference on trained weights
- 11 interactive visual chapters explaining neural network theory from first principles
- A real-time training playground powered by Web Workers
- Interactive canvas figures, loss contours, and math formulas

---

## Built-in Commands

You can run these commands inside the `App/` directory to verify the codebase and check for errors:

```bash
npm test              # Run unit tests (Vitest)
npm run typecheck     # Check TypeScript types
npm run lint          # Check code style and lint rules
npm run check:language# Audit reading grade level and clarity
npm run test:e2e      # Run end-to-end browser tests
npm run build         # Build the production bundle
```
