export interface GlossaryEntry {
  term: string;
  definition: string;
  latex?: string;
  sectionId?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  affine: {
    term: 'Affine Transformation',
    definition: 'A math step that multiplies inputs by weights and adds a bias: Z = X · W + b. It shapes data before an activation step.',
    latex: 'Z = X \\cdot W + b',
    sectionId: 'forward-propagation',
  },
  activation: {
    term: 'Activation Function',
    definition: 'A math rule that curves the output of a layer. It lets the network learn shapes that are not flat lines.',
    latex: 'A = \\sigma(Z)',
    sectionId: 'activation-functions',
  },
  sigmoid: {
    term: 'Sigmoid Function',
    definition: 'An S-shaped curve that turns any number into a value between 0 and 1. You use it to predict probabilities.',
    latex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}',
    sectionId: 'activation-functions',
  },
  relu: {
    term: 'ReLU Function',
    definition: 'A simple rule that keeps positive numbers and turns negative numbers into zero. It helps deep networks learn fast.',
    latex: '\\text{ReLU}(z) = \\max(0, z)',
    sectionId: 'activation-functions',
  },
  backpropagation: {
    term: 'Backpropagation',
    definition: 'A method that finds how much each weight contributed to the error. It works backward from output to input.',
    latex: '\\frac{\\partial L}{\\partial W} = X^T \\cdot dZ',
    sectionId: 'backpropagation',
  },
  gradient: {
    term: 'Gradient',
    definition: 'A list of slopes showing which way to change each weight to reduce the error.',
    latex: '\\nabla_W L',
    sectionId: 'gradient-descent',
  },
  bce: {
    term: 'Binary Cross-Entropy (BCE)',
    definition: 'A score that measures mistakes on yes-or-no choices. It penalizes confident wrong guesses heavily.',
    latex: 'L = -[y \\ln(\\hat{y}) + (1-y)\\ln(1-\\hat{y})]',
    sectionId: 'loss-functions',
  },
  sgd: {
    term: 'Stochastic Gradient Descent (SGD)',
    definition: 'A method that updates weights using a small batch of data at each step.',
    latex: 'W \\leftarrow W - \\alpha \\frac{\\partial L}{\\partial W}',
    sectionId: 'mini-batch-sgd',
  },
  learningRate: {
    term: 'Learning Rate (α)',
    definition: 'A small number that sets how far weights move in each step. It controls learning speed.',
    latex: '\\alpha > 0',
    sectionId: 'gradient-descent',
  },
  heInit: {
    term: 'He Initialization',
    definition: 'A way to set starting weights based on layer size. It keeps signals from dying in ReLU networks.',
    latex: 'W \\sim \\mathcal{N}\\left(0, \\sqrt{\\frac{2}{n_{\\text{in}}}}\\right)',
    sectionId: 'weight-initialization',
  },
  gradCheck: {
    term: 'Gradient Checking',
    definition: 'A test that compares computed gradients against simple slope estimates. It checks your code for math bugs.',
    latex: '\\frac{L(\\theta+\\epsilon) - L(\\theta-\\epsilon)}{2\\epsilon}',
    sectionId: 'gradient-checking',
  },
  epoch: {
    term: 'Epoch',
    definition: 'One full pass through all training samples in your dataset.',
    sectionId: 'mini-batch-sgd',
  },
  batchSize: {
    term: 'Batch Size',
    definition: 'The count of training samples processed together in one update step.',
    sectionId: 'mini-batch-sgd',
  },
  neuron: {
    term: 'Neuron',
    definition: 'A simple unit that multiplies inputs by weights, adds a bias, and runs the sum through an activation step.',
    sectionId: 'the-neuron',
  },
  forwardPass: {
    term: 'Forward Pass',
    definition: 'Moving input data through each layer from start to end to make a prediction.',
    sectionId: 'forward-propagation',
  },
  loss: {
    term: 'Loss',
    definition: 'A single number that shows how far a prediction is from the true answer.',
    sectionId: 'loss-functions',
  },
  weights: {
    term: 'Weights',
    definition: 'Numbers that scale each input signal. The network adjusts them to learn patterns.',
    sectionId: 'the-neuron',
  },
  bias: {
    term: 'Bias',
    definition: 'An extra number added to the weighted input. It shifts the activation up or down.',
    sectionId: 'the-neuron',
  },
};

export type GlossaryKey = keyof typeof GLOSSARY;
