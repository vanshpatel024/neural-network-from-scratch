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
    
    # !----- backward to be implemented
  

class Sigmoid:
  
    def forward(self, z):
        self.z = z
        self.a = 1 / (1 + np.exp(-z))
        return self.a
    
    # !----- backward to be implemented