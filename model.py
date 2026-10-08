import numpy as np

class Sequential:
    def __init__(self, layers):
        self.layers = layers
        
    def forward(self, X):
        # looping through each layer 
        for layer in self.layers:
            
            # The output of the current layer becomes the input (X) for the next
            X = layer.forward(X)
          
        return X
    
    def backward(self, grad):
        # Loop through layers in REVERSE order
        for layer in reversed(self.layers):
            grad = layer.backward(grad)

        return grad
    
    def compile(self, loss_fn, optimizer):
        self.loss_fn = loss_fn
        self.optimizer = optimizer
        
    def fit(self, X, y, epochs=1000, batch_size=32):
        n_samples = X.shape[0]
        
        for epoch in range(epochs):
            # 1. Shuffle the dataset at the start of every epoch.
            #    This means each epoch sees the data in a different
            #    random order, so batches are never the same twice.
            permutation = np.random.permutation(n_samples)
            X_shuffled = X[permutation]
            y_shuffled = y[permutation]
            
            epoch_loss = 0
            n_batches = 0
            
            # 2. Slice the shuffled data into mini-batches.
            for start in range(0, n_samples, batch_size):
                end = start + batch_size
                X_batch = X_shuffled[start:end]
                y_batch = y_shuffled[start:end]
                
                # 3. Forward pass on this batch only
                y_pred = self.forward(X_batch)
                
                # 4. Calculate loss on this batch only
                loss = self.loss_fn.forward(y_pred, y_batch)
                epoch_loss += loss
                n_batches += 1
                
                # 5. Backward pass on this batch only
                grad = self.loss_fn.backward(y_pred, y_batch)
                self.backward(grad)
                
                # 6. Update weights — one step per batch, not per epoch
                self.optimizer.step(self.layers)
            
            # Print progress once per epoch
            if epoch % 100 == 0:
                print(f"Epoch {epoch} | Loss: {epoch_loss / n_batches:.4f}")