import numpy as np

def load_and_prep_data(filepath):
    # load data
    data = np.loadtxt(filepath, delimiter=",", skiprows=1)
    
    # split data into X and y
    X = data[:, :-1]
    y = data[:, -1]
    
    # no need to normalize pixels as they are already in the range 0-1
    
    # reshaping y labels
    # we reshape here cause it was a 1D array (1000,)
    # we convert it into a 2D matrix (1000, 1)
    y = y.reshape(-1, 1) 
    
    return X, y