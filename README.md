# Neural Network From Scratch

A deep learning project implementing neural networks from first principles using pure Python and NumPy, paired with a web visualizer and textbook.

The goal is not to use a high-level framework like TensorFlow or PyTorch. Instead, every component—from matrix transformations and scalar computational graphs to backpropagation and mini-batch SGD—is built from scratch.

---

## 📚 What This Project Includes

- **Core Python Engine**:
  - Dense layers with full forward and backward passes
  - Activation functions: Sigmoid, tanh, ReLU, and Leaky ReLU with exact analytical derivatives
  - Loss functions: Mean Squared Error (MSE) and Binary Cross-Entropy (BCE)
  - Optimizers: Mini-batch Stochastic Gradient Descent (SGD) and Momentum
  - Centered finite difference gradient checking utility
  - End-to-end training loops and synthetic dataset generators (Moons, Circles, XOR, Spirals)
- **Interactive Visual Textbook & Web Playground (`App/`)**:
  - 10 comprehensive visual chapters spanning Foundations, Learning, Training, and Live Playground
  - Multi-threaded Web Worker training engine running at 60 FPS
  - Live 2D decision boundary canvas with interactive point additions
  - Real-time neuron feature maps showing what each hidden unit learns
  - Interactive activation distribution histograms across deep networks

---

## 🚀 Running the Interactive Visualizer

The interactive guide lives in the `App/` directory:

```bash
cd App
npm install
npm run dev
```

Open `http://localhost:5173` to explore the interactive visual textbook.

For full architecture details, deployment options (Vercel & GitHub Pages), and developer scripts, see the [App Documentation](App/README.md).

---

## 🧪 Running the Quality Gates

Inside the `App/` directory:

```bash
npm test              # Run unit tests (Vitest)
npm run typecheck     # Type-check TypeScript (tsc --noEmit)
npm run lint          # Run ESLint
npm run check:language# Audit reading grade level (Grade <= 8.0)
npm run build         # Build production bundle
```

---

## 📄 License

MIT License. Free for learning, teaching, and experimentation.
