import numpy as np

class BinaryCrossEntropy:
    
    def forward(self, y_pred, y_true):
        # Prevent math errors by clipping values slightly away from 0 and 1
        y_pred = np.clip(y_pred, 1e-15, 1 - 1e-15)
        
        loss = -(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))
        
        # the average loss across all images in the batch
        avg_loss = np.mean(loss)
        
        return avg_loss
    
    def backward(self, y_pred, y_true):
        # Clip predictions to prevent division by zero during saturation
        p = np.clip(y_pred, 1e-15, 1.0 - 1e-15)
        return ((p - y_true) / (p * (1.0 - p))) / y_true.shape[0]
    

class MeanSquaredError:
    
    def forward(self, y_pred, y_true):
        return 0.5 * np.mean((y_pred - y_true)**2)
    
    def backward(self, y_pred, y_true):
        return (y_pred - y_true) / y_true.shape[0]