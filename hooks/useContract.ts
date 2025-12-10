"use client"

import { useEffect, useState } from "react"
import {
  useCurrentAccount,
  useIotaClient,
  useIotaClientQuery,
  useSignAndExecuteTransaction,
} from "@iota/dapp-kit"
import type { IotaObjectData } from "@iota/iota-sdk/client"
import { Transaction } from "@iota/iota-sdk/transactions"
import { useNetworkVariable } from "@/lib/config"

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================

export const CONTRACT_MODULE = "game"
export const CONTRACT_METHODS = {
  PLAY: "play",
} as const

// ============================================================================
// DATA EXTRACTION
// ============================================================================

function getObjectFields(data: IotaObjectData): {
  owner: string
  player: string
  playerMove: number
  machineMove: number
  result: number
} | null {
  if (data.content?.dataType !== "moveObject") {
    console.log("Data is not a moveObject:", data.content?.dataType)
    return null
  }

  type MatchFields = {
    player?: string
    player_move?: number | string
    machine_move?: number | string
    result?: number | string
  }

  const rawFields = data.content.fields as unknown
  if (!rawFields || typeof rawFields !== "object") {
    console.log("No fields found in object data")
    return null
  }
  const fields = rawFields as MatchFields

  const owner = data.owner && typeof data.owner === "object" && "AddressOwner" in data.owner
    ? String(data.owner.AddressOwner)
    : ""

  return {
    owner,
    player: String(fields.player || ""),
    playerMove: Number(fields.player_move),
    machineMove: Number(fields.machine_move),
    result: Number(fields.result),
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface ContractData {
  owner: string
  player: string
  playerMove: number
  machineMove: number
  result: number
}

export interface ContractState {
  isLoading: boolean
  isFetching: boolean
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  hash: string | undefined
  error: Error | null
}

export interface ContractActions {
  play: (playerMove: number) => Promise<void>
  loadMatch: (matchId: string) => void
  clearObject: () => void
}

export const useContract = () => {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const packageId = useNetworkVariable("packageId")
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [objectId, setObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.slice(1)
      if (hash) setObjectId(hash)
    }
  }, [])

  const { data, isPending: isFetching, error: queryError, refetch } = useIotaClientQuery(
    "getObject",
    {
      id: objectId!,
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!objectId,
    }
  )

  const fields = data?.data ? getObjectFields(data.data) : null
  const isOwner = fields?.owner?.toLowerCase() === address?.toLowerCase()
  const objectExists = !!data?.data
  const hasValidData = !!fields

  const play = async (playerMove: number) => {
    if (!packageId) {
      setTransactionError(new Error("Package ID not configured for the selected network."))
      return
    }

    if (playerMove < 0 || playerMove > 2) {
      setTransactionError(new Error("Move must be 0 (rock), 1 (paper), or 2 (scissors)."))
      return
    }

    try {
      setIsLoading(true)
      setTransactionError(null)
      setHash(undefined)

      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.pure.u8(playerMove)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.PLAY}`,
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            try {
              const { effects } = await iotaClient.waitForTransaction({
                digest,
                options: { showEffects: true },
              })
              const newObjectId = effects?.created?.[0]?.reference?.objectId
              if (newObjectId) {
                setObjectId(newObjectId)
                if (typeof window !== "undefined") {
                  window.location.hash = newObjectId
                }
              } else {
                console.warn("No object ID found in transaction effects")
              }
              await refetch()
            } catch (waitError) {
              console.error("Error waiting for transaction:", waitError)
            } finally {
              setIsLoading(false)
            }
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error playing match:", err)
      setIsLoading(false)
    }
  }

  const loadMatch = (matchId: string) => {
    if (!matchId) return
    setObjectId(matchId)
    setTransactionError(null)
    if (typeof window !== "undefined") {
      window.location.hash = matchId
    }
  }

  const contractData: ContractData | null = fields
    ? {
        owner: fields.owner,
        player: fields.player,
        playerMove: fields.playerMove,
        machineMove: fields.machineMove,
        result: fields.result,
      }
    : null

  const clearObject = () => {
    setObjectId(null)
    setTransactionError(null)
    if (typeof window !== "undefined") {
      window.location.hash = ""
    }
  }

  const actions: ContractActions = {
    play,
    loadMatch,
    clearObject,
  }

  const contractState: ContractState = {
    isLoading: isLoading || isPending,
    isFetching,
    isPending,
    isConfirming: false,
    isConfirmed: !!hash && !isLoading && !isPending,
    hash,
    error: queryError || transactionError,
  }

  return {
    data: contractData,
    actions,
    state: contractState,
    objectId,
    isOwner,
    objectExists,
    hasValidData,
    packageId,
  }
}
