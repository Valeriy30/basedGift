"use client";

import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from "wagmi";

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: ensName } = useEnsName({
    address,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName!,
    query: {
      enabled: !!ensName,
    },
  });

  return {
    address,
    isConnected,
    ensName,
    ensAvatar,
    disconnect,
  };
}
