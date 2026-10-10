# Neural Network From Scratch

This is a small learning project where I am building a neural network from scratch using Python and NumPy.

The goal is not to use a machine learning framework like TensorFlow or PyTorch. Instead, I want to understand what happens inside a neural network by implementing the basic pieces myself.

## What This Project Includes

- Dense layers with forward and backward passes
- Activation functions like ReLU and Sigmoid
- Loss functions like Mean Squared Error and Binary Cross-Entropy
- Optimizers like SGD and Adam
- Backpropagation and training loops
- An interactive web visualizer to explore the math and concepts visually

## Why I Am Doing This

I am doing this project for learning purposes. Neural networks can feel like a black box when using high-level libraries, so I wanted to build one step by step and understand the math and code behind it.

This project helps me learn how data flows through a network, how layers are connected, how activations work, and how backpropagation and optimization update the model.

## Interactive Visualizer

There is also an interactive web app in the `App` folder that explains each concept with live diagrams, formula walkthroughs, and step-by-step computation graphs.

To run the visualizer:

```bash
cd App
npm install
npm run dev
```

## Current Status

The core pieces (forward propagation, loss functions, gradient descent, and backpropagation) are implemented and tested, along with interactive visual walkthroughs for each topic.
