import { useState } from "react";
import { predictTraffic } from "../services/api";

export default function Prediction() {

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePredict = async () => {

        try {

            setLoading(true);

            const result = await predictTraffic();

            setPrediction({

                result: result.prediction,
                confidence: `${result.confidence}%`,
                recommendation: result.recommendation

            });

        }

        catch (error) {

            console.error(error);

            alert("Prediction failed. Check if the Flask backend is running.");

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <div className="space-y-8">

            <div>

                <h1 className="text-4xl text-cyan-400 font-bold">
                    Intrusion Prediction
                </h1>

                <p className="text-gray-400 mt-2">
                    Predict whether incoming network traffic is malicious.
                </p>

            </div>

            <div className="bg-white/5 rounded-2xl border border-cyan-500/20 p-8">

                <button

                    onClick={handlePredict}

                    disabled={loading}

                    className="bg-cyan-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-cyan-400 transition disabled:opacity-50"

                >

                    {

                        loading

                            ? "Predicting..."

                            : "Predict Sample Traffic"

                    }

                </button>

                {

                    prediction && (

                        <div className="mt-8 space-y-4">

                            <div>

                                <h2 className="text-gray-400">
                                    Prediction
                                </h2>

                                <h1 className={`text-3xl font-bold ${prediction.result === "Attack"
                                        ? "text-red-400"
                                        : "text-green-400"
                                    }`}>

                                    {prediction.result}

                                </h1>

                            </div>

                            <div>

                                <p className="text-gray-400">

                                    Confidence

                                </p>

                                <h3 className="text-cyan-400 text-xl">

                                    {prediction.confidence}

                                </h3>

                            </div>

                            <div>

                                <p className="text-gray-400">

                                    Recommendation

                                </p>

                                <h3 className="text-yellow-400">

                                    {prediction.recommendation}

                                </h3>

                            </div>

                        </div>

                    )

                }

            </div>

        </div>

    );

}