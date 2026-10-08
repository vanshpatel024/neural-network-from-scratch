from utils import load_and_prep_data
from layers import Dense
from activations import ReLU, Sigmoid
from model import Sequential
from loss import BinaryCrossEntropy
from optimizers import SGD
import json

X, y = load_and_prep_data("dataset/01dataset.csv")

network = Sequential([
    Dense(25, activation=ReLU()),
    Dense(15, activation=ReLU()),
    Dense(1, activation=Sigmoid())
])

network.compile(loss_fn=BinaryCrossEntropy(), optimizer=SGD(learning_rate=0.1))
network.fit(X, y, epochs=10000, batch_size=32)

weights = {
    "W1": network.layers[0].W.tolist(),
    "b1": network.layers[0].b.tolist(),
    "W2": network.layers[1].W.tolist(),
    "b2": network.layers[1].b.tolist(),
    "W3": network.layers[2].W.tolist(),
    "b3": network.layers[2].b.tolist()
}

with open("model_weights.json", "w") as f:
    json.dump(weights, f)
    
print("Weights saved to model_weights.json")