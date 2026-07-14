import { Shield, ShieldAlert } from "lucide-react";

export default function ClientCard({ client }) {

    const trust = client.trust;

    let status = "Secure";
    let color = "text-green-400";
    let border = "border-green-400/30";

    if (trust < 0.5) {
        status = "Malicious";
        color = "text-red-400";
        border = "border-red-400/30";
    } else if (trust < 0.8) {
        status = "Warning";
        color = "text-yellow-400";
        border = "border-yellow-400/30";
    }

    return (

        <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-5 border ${border}`}>

            <div className="flex justify-between items-center">

                <h2 className="text-xl font-semibold">
                    Client {client.client}
                </h2>

                {
                    status === "Secure"
                        ? <Shield className={color} />
                        : <ShieldAlert className={color} />
                }

            </div>

            <div className="mt-5 space-y-2">

                <p>
                    Accuracy :
                    <span className="text-cyan-400 ml-2">
                        {client.accuracy}%
                    </span>
                </p>

                <p>
                    Loss :
                    <span className="text-cyan-400 ml-2">
                        {client.loss}
                    </span>
                </p>

                <p>
                    Trust :
                    <span className={`${color} ml-2`}>
                        {client.trust}
                    </span>
                </p>

                <p className={`${color} font-semibold mt-4`}>
                    {status}
                </p>

            </div>

        </div>

    );

}