class Sequential:
    def __init__(self, layers):
        self.layers = layers
        
    def forward(self, X):
        
        # looping through each layer 
        for layer in self.layers:
            
            # The output of the current layer becomes the input (X) for the next
            X = layer.forward(X)
            
        return X
    
    # !----- backward to be implemented