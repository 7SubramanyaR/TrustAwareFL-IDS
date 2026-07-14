import { useEffect, useState } from "react";

import NetworkAnimation from "../components/animation/NetworkAnimation";
import StatCard from "../components/dashboard/StatCard";
import ClientCard from "../components/dashboard/ClientCard";

import { getMetrics } from "../services/api";

export default function Dashboard() {

    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMetrics();

        const interval = setInterval(() => {
        fetchMetrics();
    }, 5000);

    return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {

        try {

            setLoading(true);

            const data = await getMetrics();

            setMetrics(data);

            setError(null);

        } catch (err) {

            console.error(err);

            setError("Unable to connect to the backend.");

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (
            <div className="flex items-center justify-center h-full">
                <h2 className="text-cyan-400 text-2xl">
                    Loading Dashboard...
                </h2>
            </div>
        );

    }

    if (error) {

        return (
            <div className="flex items-center justify-center h-full">
                <h2 className="text-red-400 text-2xl">
                    {error}
                </h2>
            </div>
        );

    }

    return (

        <div className="space-y-8">

            {/* Header */}

            <div>

                <h1 className="text-4xl font-bold text-cyan-400">
                    AI Security Dashboard
                </h1>

                <p className="text-gray-400 mt-2">
                    Trust-Aware Federated Learning Intrusion Detection System
                </p>

            </div>

            {/* Global Statistics */}

            <div className="grid grid-cols-4 gap-6">

                <StatCard
                    title="Global Accuracy"
                    value={`${metrics.global_accuracy}%`}
                    color="green"
                />

                <StatCard
                    title="Global Loss"
                    value={metrics.global_loss}
                    color="red"
                />

                <StatCard
                    title="Best Accuracy"
                    value={`${metrics.best_accuracy}%`}
                    color="cyan"
                />

                <StatCard
                    title="Current Round"
                    value={metrics.current_round}
                    color="yellow"
                />

            </div>

            {/* Federated Learning Network */}

            <NetworkAnimation />

            {/* Client Cards */}

            <div>

                <h2 className="text-2xl font-bold text-cyan-400 mb-6">
                    Connected Clients
                </h2>

                <div className="grid grid-cols-3 gap-6">

                    {metrics.clients.map((client) => (

                        <ClientCard
                            key={client.client}
                            client={client}
                        />

                    ))}

                </div>

            </div>

        </div>

    );

}