# Rock Paper Scissor

Next.js + Move starter where a user plays Rock–Paper–Scissors against the contract. Each play mints a `Match` object containing both moves and the result.

## Contract Address

- **Network:** Testnet  
- **Package ID:** `0x8ecea280b288106dd7d7d9cbafe3f9f97a2fffb497fa7ce7785d4f10aeace0a7`  
- **Explorer:** https://explorer.testnet.iota.org/object/0x8ecea280b288106dd7d7d9cbafe3f9f97a2fffb497fa7ce7785d4f10aeace0a7

## Getting Started

```bash
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000, connect your wallet (testnet), and pick Rock/Paper/Scissors. The latest match object ID is saved to the URL hash.

## Manual Deployment (testnet)

```bash
cd contract/rock_paper_scissor
iota move build
iota client publish --gas-budget 100000000 --json
```

Copy the new package ID from the publish output and update `lib/config.ts` (`TESTNET_PACKAGE_ID`). The UI defaults to the testnet network.

## Move Contract

- Module: `game`
- Entry: `play(player_move: u8, ctx: &mut TxContext)`
- Result codes: `0 = draw`, `1 = player wins`, `2 = machine wins`
- Machine move: derived from the minted object ID to keep results verifiable on-chain.

## UI / Integration

- `components/sample.tsx`: Rock–Paper–Scissors flow (play, view last match, load by ID)
- `hooks/useContract.ts`: Uses `packageId` from `lib/config.ts` based on the active network and calls `game::play`
- `components/Provider.tsx`: Default network set to **testnet**

## Tips

- Keep a small amount of testnet IOTA for gas (`iota client faucet`).
- Share match URLs by copying the object ID stored in the hash.
- If you redeploy, refresh the package ID in `lib/config.ts` so the front end targets the new contract.
