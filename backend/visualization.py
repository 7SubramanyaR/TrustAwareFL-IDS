import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("results/results.csv")

avg = df.groupby("Round")["Accuracy"].mean()

plt.figure(figsize=(7,4))

plt.plot(avg.index, avg.values, marker="o")

plt.title("Global Accuracy per Round")

plt.xlabel("Round")

plt.ylabel("Accuracy")

plt.grid()

plt.savefig("results/accuracy.png")

plt.close()