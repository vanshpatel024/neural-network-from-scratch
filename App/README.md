# Neural Network From Scratch — Interactive Visual Guide

An interactive, visual textbook that teaches deep learning from first principles. Built with pure mathematics, clean TypeScript and Python reference implementations, and zero machine learning library dependencies.

---

## What This Interactive Guide Includes

1. **Foundations**:
   - **The Neuron**: Biological inspiration, linear combination ($z = \mathbf{w} \cdot \mathbf{x} + b$), and live 2D decision boundary visualization.
   - **Activation Functions**: Sigmoid, Tanh, ReLU, and Leaky ReLU with derivatives and vanishing gradient demonstrations.
   - **Forward Propagation**: Matrix multiplication, multi-layer transformations, and dimensional shape tracing.
2. **Learning**:
   - **Loss Functions**: Binary Cross-Entropy (BCE) vs. Mean Squared Error (MSE), confident error penalties, and derivative cancellation.
   - **Gradient Descent**: Step-by-step calculus, learning rates, 2D loss contours, and visual momentum simulation.
   - **Backpropagation**: The multivariate chain rule, step-by-step computational graph, and layer error signals ($dZ$).
3. **Training**:
   - **Weight Initialization**: Zero symmetry failure, vanishing/exploding signals, Xavier (Glorot), and He (Kaiming) distributions.
   - **Mini-batch SGD**: Stochastic vs. Mini-batch vs. Full Batch descent paths on 2D loss contours with noise scaling.
   - **Gradient Checking**: An interactive demo and docs topic validating analytical backprop against centered finite differences ($O(\epsilon^2)$) with deliberate bug injection testing (optional topic not in the Python project).
4. **Interactive Playground**:
   - Real-time training with ReLU, Sigmoid, Tanh, and Linear on synthetic datasets (Moons, Circles, XOR, Blobs, Spirals). Leaky ReLU appears in the Activation Functions chapter curve tool only.
   - Live Web Worker training loop (runs off the main thread at 60 FPS).
   - Real-time decision boundary canvas with click-to-add custom points.
   - Loss and accuracy curves.
   - Interactive Network architecture diagram with live weight gauges.
   - **Neurons feature map**: 2D heatmaps showing what each hidden neuron has learned.
   - Educational presets: *Why XOR needs a hidden layer*, *Learning rate too high*, and *Bad initialization*.

---

## Quickstart & Setup

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm 9+

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/vanshpatel024/neural-network-from-scratch.git
cd neural-network-from-scratch/App

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with hot module replacement (HMR) |
| `npm test` | Runs the full Vitest unit test suite |
| `npm run typecheck` | Type-checks all TypeScript files (`tsc --noEmit`) |
| `npm run lint` | Lints files using ESLint |
| `npm run check:language` | Audits text readability (Flesch-Kincaid Grade $\le 8.0$, 0 long sentences) |
| `npm run test:e2e` | Runs Playwright end-to-end tests verifying single-click scrolling |
| `npm run build` | Builds the optimized production bundle (`dist/`) |
| `npm run preview` | Previews the production build locally |

---

## Application Routes

The site provides two primary pages and a clean fallback:

- **Home (`/`)**: Interactive digit classifier where users test the trained neural network.
- **Documentation (`/docs`)**: The complete interactive deep learning textbook with all 11 chapters.
- **404 (`*`)**: Minimal, plain-language not-found page with a link back to Home.

---

## Project Architecture

```
App/
├── src/
│   ├── components/            # Design system & layout tokens
│   │   ├── layout/            # Sidebar, ProgressBar, ErrorBoundary, DocsPage
│   │   └── ui/                # Slider, Toggle, CodeBlock, Math, Callout, Figure
│   ├── lib/                   # Pure mathematical engine & algorithms (no React)
│   │   ├── activations.ts     # Activation functions & analytical derivatives
│   │   ├── autograd.ts        # Computational graph scalar engine (Micrograd-style)
│   │   ├── loss.ts            # BCE and MSE loss functions
│   │   ├── matrix.ts          # Matrix operations & linear algebra helpers
│   │   ├── optim.ts           # 2D loss contours, gradient descent, and momentum
│   │   ├── neuronsAnalysis.ts # Grid evaluation of neuron heatmaps & symmetry detection
│   │   ├── weightInitAnalysis.ts # Layer-by-layer activation signal propagation
│   │   └── nn/                # Dense layer, Sequential container, datasets, gradcheck
│   ├── sections/              # Documentation chapters and interactive figures
│   │   ├── neuron/
│   │   ├── activation-functions/
│   │   ├── forward-propagation/
│   │   ├── loss-functions/
│   │   ├── gradient-descent/
│   │   ├── backpropagation/
│   │   ├── weight-initialization/
│   │   ├── mini-batch-sgd/
│   │   ├── gradient-checking/
│   │   └── playground/        # Interactive live model training lab
│   ├── store/                 # Zustand state management
│   ├── styles/                # CSS tokens and typography
│   └── workers/               # Web Worker training loop and background calculations
├── public/                    # Favicon and static assets
└── vercel.json                # Vercel deployment SPA configuration
```

---

## Deployment

The website deploys to Vercel as a single-page app. URL rewrites ensure `/docs` works on direct visits and refreshes.

- **Deploy from repository root**: Vercel reads root `vercel.json`. It runs `cd App && npm install` and builds output to `App/dist`.
- **Deploy with Root Directory set to `App`**: In your Vercel Project Settings, set **Root Directory** to `App`. Vercel will use `App/vercel.json` directly.

---

## How to Get the Most Out of This Guide

1. **Follow the "Try this" prompts**: Every interactive figure has guided experiment challenges showing edge cases.
2. **Hover and focus formulas & code**: Code blocks feature clickable annotations that highlight the exact corresponding mathematical symbols.
3. **Run deliberate failure modes**:
   - In **Weight Initialization**, see how small weights cause signals to vanish by Layer 4.
   - In **Gradient Checking**, click "Inject Backprop Bug" to verify how finite differences catch subtle math bugs.
   - In the **Playground**, load *Bad initialization* to see why identical zero weights freeze learning.
