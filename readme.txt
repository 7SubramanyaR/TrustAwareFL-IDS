# Trust-Aware Federated Learning-Based Intrusion Detection System for IoT Networks

## Overview

The **Trust-Aware Federated Learning-Based Intrusion Detection System (TrustAwareFL-IDS)** is a cybersecurity solution designed to detect network intrusions in IoT environments while preserving data privacy through Federated Learning (FL).

Instead of collecting network traffic from all IoT devices into a centralized server, each client trains a local intrusion detection model using its own data. Only model predictions and trust information are considered during aggregation, ensuring privacy while improving security.

The system introduces a **Trust Evaluation Module**, which continuously monitors each client's behavior. Clients exhibiting suspicious or malicious activity receive lower trust scores and have reduced influence during the global aggregation process. If a client's trust score falls below a predefined threshold, it is automatically excluded from the aggregation process.

---

# Objectives

- Detect cyber attacks in IoT networks using Machine Learning.
- Preserve user privacy through Federated Learning.
- Simulate distributed IoT clients.
- Identify malicious clients using trust evaluation.
- Reduce the impact of poisoned model updates.
- Improve overall intrusion detection accuracy.
- Demonstrate trust-aware aggregation for secure model collaboration.

---

# Technologies Used

## Backend

- Python 3.12+
- Scikit-learn
- Pandas
- NumPy
- Joblib

## Dataset

- UNSW-NB15 Testing Dataset (.parquet)

## Frontend (To be implemented)

- React.js
- Tailwind CSS
- Axios
- Chart.js / Recharts

---

# Project Structure

```
TrustAwareFL-IDS/

│
├── backend/
│
│   ├── dataset/
│   │      UNSW_NB15_testing-set.parquet
│   │
│   ├── models/
│   │      intrusion_model.pkl
│   │
│   ├── results/
│   │      results.csv
│   │      accuracy.png
│   │
│   ├── preprocess.py
│   ├── train.py
│   ├── client.py
│   ├── trust.py
│   ├── aggregator.py
│   ├── simulate_fl.py
│   ├── logger.py
│   ├── visualization.py
│   ├── config.py
│   └── requirements.txt
│
└── frontend/
```

---

# Description of Each Python File

## config.py

Stores all project configuration variables.

Responsibilities:

- Dataset path
- Model path
- Train/Test split ratio
- Random seed
- Future configuration variables

---

## preprocess.py

Responsible for preparing the UNSW-NB15 dataset before training.

Functions:

- Load dataset
- Encode categorical features
- Remove unnecessary columns
- Split features and labels
- Perform train-test split

Output:

- X_train
- X_test
- y_train
- y_test

---

## train.py

Trains the initial centralized Random Forest model.

Responsibilities:

- Load preprocessed dataset
- Train Random Forest classifier
- Evaluate performance
- Display classification report
- Save trained model (.pkl)

Output:

```
intrusion_model.pkl
```

---

## client.py

Represents an individual Federated Learning client.

Each client:

- Receives local dataset
- Trains a local Random Forest model
- Predicts on global test data
- Returns

```
Client ID

Accuracy

Predictions

Model
```

---

## trust.py

Implements the Trust Evaluation Module.

Responsibilities:

- Calculate trust score
- Simulate consistency
- Maintain participation history
- Maintain reliability history
- Update trust after every FL round

Trust Score Components

- Model Accuracy (50%)
- Consistency (20%)
- Participation (20%)
- Reliability (10%)

---

## aggregator.py

Acts as the Federated Learning Server.

Responsibilities:

- Receive client models
- Calculate trust scores
- Assign aggregation weights
- Exclude malicious clients
- Perform trust-weighted ensemble aggregation
- Compute global accuracy

This module is the core of the Trust-Aware Federated Learning system.

---

## simulate_fl.py

Main driver of the project.

Responsibilities:

- Split dataset into multiple clients
- Simulate Federated Learning rounds
- Simulate Mirai Botnet attack
- Perform local training
- Call trust-aware aggregation
- Store simulation results

Current Configuration

```
Clients : 4

Rounds : 5

Malicious Client : Client 3
```

---

## logger.py

Responsible for recording simulation results.

Logs:

- Round Number
- Client ID
- Accuracy
- Trust Score
- Aggregation Weight
- Client Status

Output

```
results.csv
```

---

## visualization.py

Reads simulation logs and generates performance graphs.

Graphs

- Global Accuracy
- Trust Score
- Client Performance
- Aggregation Weights

Outputs

```
accuracy.png

trust.png

performance.png
```

---

# Workflow

```
UNSW-NB15 Dataset
        │
        ▼
Data Preprocessing
        │
        ▼
Split Dataset into Clients
        │
        ▼
Local Model Training
        │
        ▼
Mirai Attack Simulation
        │
        ▼
Trust Score Calculation
        │
        ▼
Trust-Aware Aggregation
        │
        ▼
Global Intrusion Detection Model
        │
        ▼
CSV Logging
        │
        ▼
Performance Visualization
```

---

# Trust Evaluation Strategy

Every client receives a trust score based on

- Local model accuracy
- Prediction consistency
- Historical participation
- Reliability score

Clients with low trust scores receive smaller aggregation weights.

If

```
Trust < 0.40
```

the client is excluded from the aggregation process.

---

# Federated Learning Simulation

Current implementation simulates

- Four IoT clients
- One Federated Learning server
- Five communication rounds
- Trust-aware weighted aggregation
- Mirai Botnet label poisoning attack
- Dynamic trust evolution
- Client exclusion

---

# Current Features

✔ Data preprocessing

✔ Random Forest IDS

✔ Federated Learning simulation

✔ Four virtual IoT clients

✔ Trust Evaluation Module

✔ Dynamic trust calculation

✔ Mirai attack simulation

✔ Trust-weighted aggregation

✔ CSV logging

✔ Performance visualization

---

# Future Enhancements

- Flask REST API
- React Dashboard
- Live client monitoring
- Real-time trust visualization
- Multiple attack simulations
- Flower-based Federated Learning
- Docker deployment
- JWT authentication
- WebSocket-based live updates
- Cloud deployment

---

# Expected Outputs

- Trained Intrusion Detection Model
- Global Accuracy
- Client Trust Scores
- Aggregation Weights
- Simulation Logs
- Performance Graphs
- Interactive Dashboard (Upcoming)

---

## Dataset

This project uses the UNSW-NB15 dataset.

Download the dataset from the official source and place the files inside:

```
dataset/
```

Required files:

- UNSW_NB15_training-set.parquet
- UNSW_NB15_testing-set.parquet