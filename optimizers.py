class SGD:
    
    def __init__(self, learning_rate=0.1):
        self.learning_rate = learning_rate
    
    def step(self, layers):
        for layer in layers:
            # We only update layers that have weights (Desnse layers)
            if hasattr(layer, 'W'):
                layer.W = layer.W - (self.learning_rate * layer.dW)
                layer.b = layer.b - (self.learning_rate * layer.db)