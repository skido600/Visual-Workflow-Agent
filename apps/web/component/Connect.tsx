"use client";

import { useEffect, useState } from "react";
import { Monitor, Loader2, CheckCircle2 } from "lucide-react";

type AgentStatus = "checking" | "connected" | "disconnected";

export default function Connect() {
  const [status, setStatus] = useState<AgentStatus>("checking");
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  // Check whether the local agent already has a saved token.
  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch("http://127.0.0.1:4317/status", {
          headers: {
            "X-Agent-Request": "connect",
          },
        });

        if (!response.ok) {
          setStatus("disconnected");
          return;
        }

        const result = await response.json();

        setStatus(result.connected ? "connected" : "disconnected");
      } catch {
        setStatus("disconnected");
      }
    }

    checkConnection();
  }, []);

  async function handleConnect() {
    try {
      setConnecting(true);
      setMessage("");

      const response = await fetch("http://127.0.0.1:4317/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Request": "connect",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not connect device");
      }

      if (result.alreadyConnected) {
        setStatus("connected");
        return;
      }

      setMessage("Approve the pairing request in your browser.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not reach desktop agent. Is it running?",
      );
    } finally {
      setConnecting(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        Checking device...
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500">
        <CheckCircle2 size={16} />
        Device connected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
        {connecting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Monitor size={16} />
        )}

        {connecting ? "Connecting..." : "Connect Device"}
      </button>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
