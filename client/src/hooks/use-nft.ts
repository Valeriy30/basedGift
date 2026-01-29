import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ERC721_ABI, BASE_CHAIN_ID } from '@/lib/wagmi';
import { parseAbi } from 'viem';

export interface NFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  image?: string;
  tokenUri?: string;
}

// Простой хук для получения NFT пользователя
// В продакшене лучше использовать API типа Alchemy или Moralis
export function useUserNFTs() {
  const { address } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) {
        setNfts([]);
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Интеграция с Base NFT API
        // Временно возвращаем пустой массив
        // В продакшене использовать: Alchemy NFT API, Moralis, или SimpleHash
        setNfts([]);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address]);

  return { nfts, isLoading };
}

// Хук для трансфера NFT
export function useTransferNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transferNFT = async (
    contractAddress: string,
    tokenId: string,
    to: string,
    from: string
  ) => {
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'safeTransferFrom',
        args: [from as `0x${string}`, to as `0x${string}`, BigInt(tokenId)],
        chainId: BASE_CHAIN_ID,
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

// Хук для получения информации о NFT
export function useNFTMetadata(contractAddress: string | undefined, tokenId: string | undefined) {
  const { data: tokenUri } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'tokenURI',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    chainId: BASE_CHAIN_ID,
  });

  const [metadata, setMetadata] = useState<{
    name?: string;
    description?: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenUri) return;

      try {
        // Если URI начинается с ipfs://, конвертируем в HTTP URL
        let url = tokenUri as string;
        if (url.startsWith('ipfs://')) {
          url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        const response = await fetch(url);
        const data = await response.json();
        
        // Конвертируем IPFS image URL если нужно
        if (data.image?.startsWith('ipfs://')) {
          data.image = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        setMetadata(data);
      } catch (error) {
        console.error('Error fetching NFT metadata:', error);
      }
    };

    fetchMetadata();
  }, [tokenUri]);

  return { metadata, tokenUri };
}
