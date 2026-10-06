import numpy as np

class BinaryCrossEntropy:
    
    def forward(self, y_pred, y_true):
        # Prevent math errors by clipping values slightly away from 0 and 1
        y_pred = np.clip(y_pred, 1e-15, 1 - 1e-15)
        
        loss = -(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))
        
        # the average loss across all images in the batch
        avg_loss = np.mean(loss)
        
        return avg_loss
    
    # !----- backward to be implemented