"use client"

import { useCurrentAccount } from "@iota/dapp-kit"
import { useContract } from "@/hooks/useContract"
import { Button, Container, Flex, Heading, Separator, Text, TextField } from "@radix-ui/themes"
import ClipLoader from "react-spinners/ClipLoader"
import { useMemo, useState } from "react"

const moves = [
  { label: "Rock", value: 0 },
  { label: "Paper", value: 1 },
  { label: "Scissors", value: 2 },
]

const moveName = (value?: number) => {
  const found = moves.find((m) => m.value === value)
  return found ? found.label : "Unknown"
}

const resultLabel = (result?: number) => {
  if (result === 0) return "Draw"
  if (result === 1) return "You won"
  if (result === 2) return "Machine won"
  return "Not played yet"
}

const SampleIntegration = () => {
  const currentAccount = useCurrentAccount()
  const { data, actions, state, objectId, objectExists, hasValidData, packageId } = useContract()
  const [matchIdInput, setMatchIdInput] = useState("")

  const isConnected = !!currentAccount
  const disabled = state.isPending || state.isLoading

  const statusText = useMemo(() => {
    if (state.isPending || state.isLoading) return "Submitting move..."
    if (state.isConfirmed) return "Transaction confirmed"
    if (state.error) return "Something went wrong"
    return "Ready to play"
  }, [state.isPending, state.isLoading, state.isConfirmed, state.error])

  if (!isConnected) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ maxWidth: "520px", width: "100%", background: "var(--gray-a2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--gray-a5)" }}>
          <Heading size="6" style={{ marginBottom: "0.75rem" }}>Rock · Paper · Scissors</Heading>
          <Text size="2" style={{ color: "var(--gray-a11)" }}>
            Connect your wallet to challenge the on-chain machine. Each play mints a match object that stores both moves and the outcome.
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", padding: "1rem", background: "linear-gradient(135deg, #0f172a 0%, #0b1221 100%)" }}>
      <Container style={{ maxWidth: "920px", margin: "0 auto" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem" }}>
          <Flex justify="between" align="center" gap="3" wrap="wrap">
            <div>
              <Heading size="7" style={{ marginBottom: "0.35rem" }}>Rock · Paper · Scissors</Heading>
              <Text size="2" style={{ color: "var(--gray-a11)" }}>
                Play against a pseudo-random on-chain machine. Results are stored as Move objects on testnet.
              </Text>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text size="1" style={{ color: "var(--gray-a9)", display: "block" }}>Package ID</Text>
              <Text style={{ fontFamily: "monospace", color: "#ffffff", wordBreak: "break-all" }}>
                {packageId || "Not deployed"}
              </Text>
            </div>
          </Flex>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.25rem" }}>
            <Flex justify="between" align="center" wrap="wrap" gap="3" style={{ marginBottom: "0.75rem" }}>
              <div>
                <Heading size="5" style={{ marginBottom: "0.35rem" }}>Choose your move</Heading>
                <Text size="2" style={{ color: "var(--gray-a11)" }}>Machine move is derived from the minted object ID.</Text>
              </div>
              <Text size="2" style={{ color: "var(--gray-a10)" }}>{statusText}</Text>
            </Flex>
            <Separator style={{ marginBottom: "0.75rem", background: "var(--gray-a6)" }} />
            <Flex gap="3" wrap="wrap">
              {moves.map((move) => (
                <Button
                  key={move.value}
                  size="3"
                  variant="soft"
                  disabled={disabled || !packageId}
                  onClick={() => actions.play(move.value)}
                >
                  {disabled && state.isPending ? <ClipLoader size={14} style={{ marginRight: "8px" }} /> : null}
                  {move.label}
                </Button>
              ))}
            </Flex>
            {!packageId && (
              <Text size="2" style={{ color: "var(--red-10)", marginTop: "0.75rem", display: "block" }}>
                Package ID missing. Deploy the Move package to testnet to enable play.
              </Text>
            )}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.25rem" }}>
            <Flex justify="between" align="center" wrap="wrap" gap="3" style={{ marginBottom: "0.75rem" }}>
              <div>
                <Heading size="5" style={{ marginBottom: "0.35rem" }}>Latest match</Heading>
                <Text size="2" style={{ color: "var(--gray-a11)" }}>Matches are stored as Move objects. Paste an object ID to inspect.</Text>
              </div>
              <Flex gap="2" align="center">
                <TextField.Root
                  value={matchIdInput || objectId || ""}
                  onChange={(e) => setMatchIdInput(e.target.value)}
                  placeholder="Paste match object ID"
                  style={{ minWidth: "260px" }}
                />
                <Button
                  variant="soft"
                  disabled={!(matchIdInput || objectId)}
                  onClick={() => actions.loadMatch(matchIdInput || objectId || "")}
                >
                  Load
                </Button>
                <Button
                  variant="ghost"
                  color="gray"
                  onClick={() => {
                    setMatchIdInput("")
                    actions.clearObject()
                  }}
                >
                  Clear
                </Button>
              </Flex>
            </Flex>

            <Separator style={{ marginBottom: "0.75rem", background: "var(--gray-a6)" }} />

            {state.isFetching && !data ? (
              <Text>Fetching match...</Text>
            ) : state.error ? (
              <div style={{ padding: "1rem", background: "var(--red-a3)", borderRadius: "12px" }}>
                <Text style={{ color: "var(--red-11)" }}>
                  {(state.error as Error)?.message || "Unable to read match object."}
                </Text>
              </div>
            ) : objectExists && !hasValidData ? (
              <div style={{ padding: "1rem", background: "var(--yellow-a3)", borderRadius: "12px" }}>
                <Text style={{ color: "var(--yellow-11)" }}>
                  Object found, but its data layout does not match the expected Match struct.
                </Text>
              </div>
            ) : data ? (
              <div style={{ display: "grid", gap: "0.65rem" }}>
                <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--gray-a3)" }}>
                  <Text size="2" style={{ display: "block", color: "var(--gray-12)" }}>Outcome</Text>
                  <Text size="4" style={{ color: data.result === 1 ? "var(--green-10)" : data.result === 2 ? "var(--red-10)" : "var(--amber-10)" }}>
                    {resultLabel(data.result)}
                  </Text>
                </div>
                <div style={{ display: "grid", gap: "0.35rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  <div style={{ padding: "0.75rem", background: "var(--gray-a3)", borderRadius: "10px" }}>
                    <Text size="1" style={{ color: "var(--gray-a10)" }}>Player</Text>
                    <Text style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{data.player}</Text>
                  </div>
                  <div style={{ padding: "0.75rem", background: "var(--gray-a3)", borderRadius: "10px" }}>
                    <Text size="1" style={{ color: "var(--gray-a10)" }}>Player move</Text>
                    <Text size="3">{moveName(data.playerMove)}</Text>
                  </div>
                  <div style={{ padding: "0.75rem", background: "var(--gray-a3)", borderRadius: "10px" }}>
                    <Text size="1" style={{ color: "var(--gray-a10)" }}>Machine move</Text>
                    <Text size="3">{moveName(data.machineMove)}</Text>
                  </div>
                </div>
                <div style={{ padding: "0.75rem", background: "var(--gray-a3)", borderRadius: "10px" }}>
                  <Text size="1" style={{ color: "var(--gray-a10)" }}>Match object</Text>
                  <Text style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{objectId}</Text>
                </div>
              </div>
            ) : (
              <Text size="2" style={{ color: "var(--gray-a10)" }}>No match loaded yet.</Text>
            )}
          </div>

          {state.hash && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1rem" }}>
              <Text size="2" style={{ display: "block", marginBottom: "0.35rem" }}>Latest transaction</Text>
              <Text style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{state.hash}</Text>
              {state.isConfirmed && (
                <Text size="2" style={{ color: "var(--green-10)", marginTop: "0.35rem", display: "block" }}>
                  Confirmed on-chain
                </Text>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default SampleIntegration
