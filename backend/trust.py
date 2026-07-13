import random

# -----------------------------
# Dynamic Trust Database
# -----------------------------

client_history = {

    1: {
        "participation": 1.0,
        "reliability": 0.98,
        "trust": 1.0
    },

    2: {
        "participation": 1.0,
        "reliability": 0.96,
        "trust": 1.0
    },

    3: {
        "participation": 0.80,
        "reliability": 0.50,
        "trust": 0.70
    },

    4: {
        "participation": 1.0,
        "reliability": 0.97,
        "trust": 1.0
    }

}


def consistency_score(accuracy):

    variation = random.uniform(-0.02,0.02)

    score = accuracy + variation

    return max(0,min(score,1))


def calculate_trust(client_id, accuracy):

    history = client_history[client_id]

    consistency = consistency_score(accuracy)

    trust = (

        0.50 * accuracy +

        0.20 * consistency +

        0.20 * history["participation"] +

        0.10 * history["reliability"]

    )

    trust = max(0,min(trust,1))

    history["trust"] = trust

    return round(trust,3)


def update_history(client_id, trust):

    history = client_history[client_id]

    if trust < 0.50:

        history["participation"] *= 0.90

        history["reliability"] *= 0.85

    else:

        history["participation"] = min(
            1.0,
            history["participation"] + 0.01
        )

        history["reliability"] = min(
            1.0,
            history["reliability"] + 0.01
        )

    history["trust"] = trust


def get_history(client_id):

    return client_history[client_id]