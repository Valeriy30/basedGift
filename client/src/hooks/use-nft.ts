import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { ERC721_ABI } from '@/lib/wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface NFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  image?: string;
  tokenUri?: string;
}

// NFT Image placeholder (base64 inline SVG)
export const NFT_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNODAgMTIwIDEwMCA4MCAxMjAgMTIwIiBmaWxsPSIjOUI5Q0FFIi8+PHBhdGggZD0iTTYwIDEyMCA5MCAxMDAgMTQwIDEyMCIgZmlsbD0iI0I0QjVDNiIvPjxjaXJjbGUgY3g9IjEzMCIgY3k9IjcwIiByPSIxNSIgZmlsbD0iIzlCOUNBRSIvPjwvc3ZnPg==";

// IPFS gateways with fallback
const IPFS_GATEWAYS = [
  'https://nftstorage.link/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.io/ipfs/',
];

// Resolve IPFS URL with gateway fallback
async function getIPFSUrl(ipfsUrl: string): Promise<string> {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl;
  }

  const hash = ipfsUrl.replace('ipfs://', '');
  
  for (const gateway of IPFS_GATEWAYS) {
    const url = `${gateway}${hash}`;
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        return url;
      }
    } catch {
      continue;
    }
  }
  
  return `${IPFS_GATEWAYS[0]}${hash}`;
}

/**
 * Fetch user's NFTs from Alchemy — respects chainId for correct network.
 * Query key includes chainId so NFT list refreshes on network switch.
 */
export function useUserNFTs() {
  const { address } = useAccount();
  const chainId = useChainId();
  const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

  const baseUrl = chainId === 8453
    ? `https://base-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_KEY}`
    : `https://base-sepolia.g.alchemy.com/nft/v2/${ALCHEMY_KEY}`;

  const { data: nfts = [], isLoading, error } = useQuery({
    // chainId in the key — cache is per-network, auto-refetches on switch
    queryKey: ['user-nfts', address, chainId],
    enabled: !!address && !!ALCHEMY_KEY,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 2,
    queryFn: async () => {
      try {
        console.log('[useUserNFTs] Fetching NFTs:', { address, chainId, baseUrl });
        
        const response = await fetch(`${baseUrl}/getNFTs?owner=${address}&withMetadata=true`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useUserNFTs] API error:', response.status, errorText);
          throw new Error(`Failed to fetch NFTs: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[useUserNFTs] Raw API response:', data);

        if (!data.ownedNfts || !Array.isArray(data.ownedNfts)) {
          console.warn('[useUserNFTs] No ownedNfts array in response');
          return [];
        }

        if (data.ownedNfts.length === 0) {
          console.log('[useUserNFTs] User has no NFTs on this network');
          return [];
        }

        const nftsPromises = data.ownedNfts.map(async (nft: any) => {
          let imageUrl = nft.metadata?.image || nft.media?.[0]?.gateway || nft.tokenUri?.gateway;
          
          if (imageUrl && imageUrl.startsWith('ipfs://')) {
            try {
              imageUrl = await getIPFSUrl(imageUrl);
            } catch (ipfsError) {
              console.warn('[useUserNFTs] IPFS resolution failed:', ipfsError);
              imageUrl = null;
            }
          }

          return {
            contractAddress: nft.contract.address,
            tokenId: nft.id.tokenId,
            name: nft.title || nft.metadata?.name || `#${nft.id.tokenId}`,
            image: imageUrl || null,
            tokenUri: nft.tokenUri?.raw,
          };
        });

        const resolvedNfts = await Promise.all(nftsPromises);
        console.log('[useUserNFTs] Resolved NFTs:', resolvedNfts.length, resolvedNfts);
        return resolvedNfts;
      } catch (err) {
        console.error('[useUserNFTs] Query error:', err);
        throw err;
      }
    }
  });

  if (error) {
    console.error('[useUserNFTs] React Query error:', error);
  }

  return { nfts, isLoading, error };
}

// Transfer NFT hook
export function useTransferNFT() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const transferNFT = async (
    contractAddress: string,
    tokenId: string,
    to: string,
    from: string
  ) => {
    try {
      return await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'safeTransferFrom',
        args: [from as `0x${string}`, to as `0x${string}`, BigInt(tokenId)],
        chainId,
        gas: 120_000n,
      });
    } catch (err) {
      console.error('Error transferring NFT:', err);
      throw err;
    }
  };

  return {
    transferNFT,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// NFT metadata hook
export function useNFTMetadata(contractAddress: string | undefined, tokenId: string | undefined) {
  const { data: tokenUri } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'tokenURI',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!contractAddress && !!tokenId, 
      staleTime: 1000 * 60 * 15,
    }
  });

  const [metadata, setMetadata] = useState<{
    name?: string;
    description?: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    if (!tokenUri || typeof tokenUri !== 'string') return;
    const controller = new AbortController();

    const fetchMetadata = async () => {
      try {
        let data;

        if (tokenUri.startsWith('data:application/json;base64,')) {
          const json = atob(tokenUri.split(',')[1]);
          data = JSON.parse(json);
        } else {
          let url = tokenUri;
          if (url.startsWith('ipfs://')) {
            url = await getIPFSUrl(url);
          }
          const response = await fetch(url, { signal: controller.signal });
          data = await response.json();
        }
        
        if (data.image?.startsWith('ipfs://')) {
          data.image = await getIPFSUrl(data.image);
        }

        setMetadata(data);
      } catch (e) {
        if ((e as any).name !== 'AbortError') console.error(e);
      }
    };

    fetchMetadata();
    return () => controller.abort();
  }, [tokenUri]);

  return { metadata, tokenUri };
}
