"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect, useConnect } from "wagmi";
import { ChevronDown, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // auto close on outside click
  useEffect(() => {
    const handleClick = () => setOpen(false);
    if (open) {
      window.addEventListener("click", handleClick);
    }
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // -------------------------
  // NOT CONNECTED
  // -------------------------
  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="
          flex items-center gap-2
          bg-white/10 backdrop-blur-md
          border border-white/20
          rounded-xl px-4 py-2.5
          text-black
          hover:bg-white/15
          hover:border-white/30
          transition-all duration-200
          shadow-lg
        "
      >
        <Wallet size={16} />
        <span className="font-medium text-sm">Connect Wallet</span>
      </button>
    );
  }

  // -------------------------
  // CONNECTED
  // -------------------------
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2
          bg-white/10 backdrop-blur-md
          border border-white/20
          rounded-xl px-4 py-2.5
          text-black
          hover:bg-white/15
          hover:border-white/30
          transition-all duration-200
          shadow-lg
        "
      >
        {/* Wallet Icon */}
        <Wallet size={16} />

        {/* Short Address */}
        <span className="font-medium text-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>

        {/* Online indicator */}
        <div className="w-2 h-2 bg-green-400 rounded-full" />

        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-56
            bg-white backdrop-blur-xl
            border border-white/20
            rounded-xl
            shadow-2xl
            overflow-hidden
            z-50
            animate-in fade-in zoom-in-95 duration-150
          "
        >
          {/* Address block */}
          <div className="px-4 py-3 border-b border-black/10">
            <div className="text-xs text-black/60 mb-1">Connected as</div>
            <div className="text-sm font-medium break-all">
              {address}
            </div>
          </div>

          {/* Copy */}
          <button
            onClick={copyAddress}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors"
          >
            <Copy size={16} />
            {copied ? "Copied!" : "Copy address"}
          </button>

          {/* View on BaseScan */}
          <a
            href={`https://basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors"
          >
            <ExternalLink size={16} />
            View on BaseScan
          </a>

          {/* Disconnect */}
          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors text-red-500"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
