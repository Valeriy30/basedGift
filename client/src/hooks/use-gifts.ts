import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertGift, type Gift } from "@shared/schema";
import { useTransferUSDC } from "./use-usdc";
import { useTransferNFT } from "./use-nft";

// GET /api/gifts/:id
export function useGift(id: string) {
  return useQuery({
    queryKey: [api.gifts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.gifts.get.path, { id });
      const res = await fetch(url);
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch gift');
      
      const data = await res.json();
      return api.gifts.get.responses[200].parse(data);
    },
    enabled: !!id,
    retry: false,
  });
}

// GET /api/gifts/sender/:address — for the sender dashboard
export function useMyGifts(address: string | undefined) {
  return useQuery({
    queryKey: ['gifts', 'sender', address],
    queryFn: async () => {
      const res = await fetch(`/api/gifts/sender/${address}`);
      if (!res.ok) throw new Error('Failed to fetch gifts');
      return res.json() as Promise<import('@shared/schema').Gift[]>;
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

// POST /api/gifts
export function useCreateGift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertGift) => {
      // Для USDC и NFT транзакции будут выполняться на стороне клиента
      // при клейме подарка. Здесь просто сохраняем информацию о подарке.
      
      const res = await fetch(api.gifts.create.path, {
        method: api.gifts.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.gifts.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create gift');
      }

      return api.gifts.create.responses[201].parse(await res.json());
    },
    onSuccess: (newGift) => {
      // Pre-seed the cache for this gift so immediate navigation works smoothly
      queryClient.setQueryData([api.gifts.get.path, newGift.id], newGift);
    },
  });
}

// PATCH /api/gifts/:id/confirm — promotes a 'pending' gift to 'created' after blockchain success
export function useConfirmGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, escrowTxHash }: { id: string; escrowTxHash: string }) => {
      const url = buildUrl(api.gifts.confirm.path, { id });
      const res = await fetch(url, {
        method: api.gifts.confirm.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowTxHash }),
      });

      if (!res.ok) throw new Error('Failed to confirm gift');

      return api.gifts.confirm.responses[200].parse(await res.json());
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([api.gifts.get.path, updated.id], updated);
    },
  });
}

// DELETE /api/gifts/:id/pending — cancel a stuck pending gift
export function useCancelPendingGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/gifts/${id}/pending`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not cancel gift');
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['gifts', 'sender'] });
      queryClient.removeQueries({ queryKey: ['/api/gifts/:id', id] });
    },
  });
}

// PATCH /api/gifts/:id/claim
// Этот хук теперь только обновляет статус в базе данных
// Реальная транзакция выполняется в компоненте ClaimGift
export function useClaimGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      receiverAddress, 
      claimTxHash 
    }: { 
      id: string; 
      receiverAddress: string;
      claimTxHash?: string;
    }) => {
      const url = buildUrl(api.gifts.claim.path, { id });
      const res = await fetch(url, {
        method: api.gifts.claim.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'claimed',
          receiverAddress,
          claimTxHash: claimTxHash || 'pending',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to claim gift');
      }

      return api.gifts.claim.responses[200].parse(await res.json());
    },
    onSuccess: (updatedGift) => {
      queryClient.invalidateQueries({ queryKey: [api.gifts.get.path, updatedGift.id] });
    },
  });
}
