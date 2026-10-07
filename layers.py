import numpy as np

class Dense:
  
    def __init__(self, units, activation):
        self.units = units
        self.activation = activation
        self.W = None
        self.b = None
    
    def forward(self, X):
        self.X = X
        
        if self.W is None:
            # Number of rows = number of samples
            # Number of columns = number of input features
            n_in = X.shape[1]
            
            # Initialize weights using He initialization.
            
            # We don't initialize all weights to 0 because
            # that would prevent the neurons from learning
            # different things. 
            
            # We initialize W here instead of in __init__
            # because we don't know the number of input features
            # until we receive X.
            
            # here self.units acts as number of output
            self.W = np.random.randn(n_in, self.units) * np.sqrt(2 / n_in)
            
            # Initialize Biases to zero
            self.b = np.zeros((1, self.units))
        
        self.Z = np.dot(X, self.W) + self.b
        
        # Apply activation if provided
        if self.activation is not None:
            return self.activation.forward(self.Z)
        
        # If not activaton provided return raw values of Z
        return self.Z
    
    
    def backward(self, grad):
        # 1. Backprop through activation if present
        if self.activation is not None:
            grad = self.activation.backward(grad)
        
        # 2. Compute gradients for parameters
        self.dW = np.dot(self.X.T, grad)
        self.db = np.sum(grad, axis=0, keepdims=True)
        
        # 3. Return gradient with respect to inputs to pass to previous layer
        return np.dot(grad, self.W.T)