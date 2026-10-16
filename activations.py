import numpy as np

'''
Some abbreviations and their explanations

z = w · x + b       weighted sum (or pre-activation)
a = activation(z)   activation/output of the neuron
'''

class ReLU:
  
    def forward(self, z):
        self.z = z
        self.a = np.maximum(0, z)
        return self.a
    
    def backward(self, dA):
        return dA * (self.z > 0)
  

class Sigmoid:
  
    def forward(self, z):
        self.z = z
        self.a = 1 / (1 + np.exp(-z))
        return self.a
    
    def backward(self, dA):
        # Keep 'a' away from exactly 0 and 1, the same limit the loss uses.
        a = np.clip(self.a, 1e-15, 1 - 1e-15)
        return dA * (a * (1 - a))
    
    
class Tanh:
    
    def forward(self, z):
        self.z = z
        exp_z = np.exp(z)
        exp_neg_z = np.exp(-z)
        self.a = (exp_z - exp_neg_z) / (exp_z + exp_neg_z)
        return self.a
    
    def backward(self, dA):
        return dA * (1.0 - self.a**2)
    
    
class LeakyReLU:

    def __init__(self, alpha=0.01):
        self.alpha = alpha
    
    def forward(self, z):
        self.z = z
        return np.where(z > 0, z, self.alpha * z)
    
    def backward(self, dA):
        dz = np.where(self.z > 0, 1.0, self.alpha)
        return dA * dz