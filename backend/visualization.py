import os
import pandas as pd
import matplotlib.pyplot as plt

# -----------------------------
# Create graphs folder
# -----------------------------
os.makedirs("graphs", exist_ok=True)

# -----------------------------
# Load log file
# -----------------------------
df = pd.read_csv("logs/training_log.csv")

# -----------------------------
# Average Accuracy Per Round
# -----------------------------
accuracy = df.groupby("Round")["Accuracy"].mean()

plt.figure(figsize=(8,5))
plt.plot(accuracy.index, accuracy.values, marker="o")
plt.title("Average Client Accuracy")
plt.xlabel("Federated Round")
plt.ylabel("Accuracy")
plt.grid(True)
plt.savefig("graphs/accuracy.png")
plt.close()

# -----------------------------
# Average Loss Per Round
# -----------------------------
loss = df.groupby("Round")["Loss"].mean()

plt.figure(figsize=(8,5))
plt.plot(loss.index, loss.values, marker="o")
plt.title("Average Client Loss")
plt.xlabel("Federated Round")
plt.ylabel("Loss")
plt.grid(True)
plt.savefig("graphs/loss.png")
plt.close()

# -----------------------------
# Trust Score Evolution
# -----------------------------
plt.figure(figsize=(8,5))

for client in sorted(df["Client"].unique()):
    client_data = df[df["Client"] == client]

    plt.plot(
        client_data["Round"],
        client_data["Trust"],
        marker="o",
        label=f"Client {client}"
    )

plt.title("Trust Score Evolution")
plt.xlabel("Federated Round")
plt.ylabel("Trust Score")
plt.legend()
plt.grid(True)

plt.savefig("graphs/trust.png")
plt.close()

print("\nGraphs generated successfully!")
print("Saved in backend/graphs/")