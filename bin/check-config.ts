import { groupBy } from "lodash"

type Hex = `0x${string}`

type BeefyVault = {
  id: string
  vault_address: Hex
  undelying_lp_address: Hex | undefined
  strategy_address: Hex
  vault_token_symbol: string
  chain: string
  eol: boolean
  tvl: number
  reward_pools: BeefyRewardPool[]
  boosts: BeefyBoost[]
  pointStructureIds: string[]
  platformId: ApiPlatformId
} & (
  | {
      protocol_type: "beefy_clm_vault"
      beefy_clm_manager: BeefyVault
    }
  | {
      protocol_type: Exclude<BeefyProtocolType, "beefy_clm_vault">
    }
)

type BeefyRewardPool = {
  id: string
  clm_address: Hex
  reward_pool_address: Hex
}

type BeefyBoost = {
  id: string
  boost_address: Hex
  underlying_address: Hex
}

type BeefyProtocolType = "aave" | "balancer_aura" | "beefy_clm_vault" | "beefy_clm" | "curve" | "gamma" | "ichi" | "pendle_equilibria" | "solidly"

type ApiPlatformId =
  | "aerodrome"
  | "aura"
  | "beefy"
  | "curve"
  | "equilibria"
  | "gamma"
  | "ichi"
  | "lendle"
  | "lynex"
  | "magpie"
  | "mendi"
  | "nile"
  | "velodrome"

type ApiStrategyTypeId = "lp" | "multi-lp" | "multi-lp-locked" | "cowcentrated"

type ApiVault = {
  id: string
  name: string
  status: "active" | "eol"
  earnedTokenAddress: string
  depositTokenAddresses?: string[]
  chain: string
  platformId: ApiPlatformId
  token: string
  tokenAddress?: string
  earnedToken: string
  isGovVault?: boolean
  strategyTypeId?: ApiStrategyTypeId
  bridged?: object
  assets?: string[]
  strategy: Hex
  pointStructureIds?: string[]
}

type ApiClmManager = {
  id: string
  name: string
  status: "active" | "eol"
  version: number
  platformId: ApiPlatformId
  strategyTypeId?: ApiStrategyTypeId
  earnedToken: string
  strategy: string
  chain: string
  type: "cowcentrated" | "others"
  tokenAddress: string // underlying pool address
  depositTokenAddresses: string[] // token0 and token1
  earnContractAddress: string // reward pool address
  earnedTokenAddress: string // clm manager address
  pointStructureIds?: string[]
}

type ApiClmRewardPool = {
  id: string
  status: "active" | "eol"
  version: number
  platformId: ApiPlatformId
  strategyTypeId?: ApiStrategyTypeId
  chain: string
  tokenAddress: string // clm address (want)
  earnContractAddress: string // reward pool address
  earnedTokenAddresses: string[] // reward tokens
}

type ApiGovVault = {
  id: string
  status: "active" | "eol"
  version: number
  chain: string
  tokenAddress: string // clm address
  earnContractAddress: string // reward pool address
  earnedTokenAddresses: string[]
}

type ApiBoost = {
  id: string
  poolId: string

  version: number
  chain: string
  status: "active" | "eol"

  tokenAddress: string // underlying
  earnedTokenAddress: string // reward token address
  earnContractAddress: string // reward pool address
}

const protocol_map: Record<ApiPlatformId, BeefyProtocolType> = {
  aerodrome: "solidly",
  aura: "balancer_aura",
  beefy: "beefy_clm",
  curve: "curve",
  equilibria: "pendle_equilibria",
  gamma: "gamma",
  ichi: "ichi",
  lendle: "aave",
  lynex: "solidly",
  magpie: "pendle_equilibria",
  mendi: "aave",
  nile: "solidly",
  velodrome: "solidly",
}

type ApiHolderCount = {
  chain: string
  token_address: Hex
  holder_count: number
}

async function main() {
  const [holderCountsData, cowVaultsData, mooVaultsData, clmRewardPoolData, [boostData, vaultRewardPoolData], tvlData] = await Promise.all([
    fetch(`https://balance-api.beefy.finance/api/v1/holders/counts/all`)
      .then((res) => res.json())
      .then((res) => res as ApiHolderCount[]),
    fetch(`https://api.beefy.finance/cow-vaults`)
      .then((res) => res.json())
      .then((res) => res as ApiClmManager[]),
    fetch(`https://api.beefy.finance/vaults`)
      .then((res) => res.json())
      .then((res) => res as ApiVault[]),
    fetch(`https://api.beefy.finance/gov-vaults`)
      .then((res) => res.json())
      .then((res) => res as ApiClmRewardPool[]),
    fetch(`https://api.beefy.finance/boosts`)
      .then((res) => res.json())
      .then((res) => [(res as ApiBoost[]).filter((g) => g.version !== 2), (res as ApiBoost[]).filter((g) => g.version === 2)] as const),
    fetch(`https://api.beefy.finance/tvl?smth=${Math.random()}`)
      .then((res) => res.json())
      .then((res) => res as Record<string, Record<string, number>>)
      .then((res) => Object.values(res).reduce((acc, v) => Object.assign(acc, v), {} as Record<string, number>)),
  ])

  const clmManagerAddresses = new Set(cowVaultsData.map((v) => v.earnedTokenAddress.toLocaleLowerCase()))
  const boostPerUnderlyingAddress = groupBy(boostData, (b) => b.tokenAddress?.toLocaleLowerCase())
  const vaultRewardPoolDataPerVaultAddress = groupBy(vaultRewardPoolData, (v) => v.tokenAddress.toLocaleLowerCase())
  const clmRewardPoolDataPerClmAddress = groupBy(clmRewardPoolData, (c) => c.tokenAddress.toLocaleLowerCase())

  const clmVaultConfigs = cowVaultsData.map((vault): BeefyVault => {
    const undelying_lp_address = vault.tokenAddress.toLocaleLowerCase() as Hex
    const vault_address = vault.earnedTokenAddress.toLocaleLowerCase() as Hex

    const protocol_type: BeefyProtocolType | undefined = vault.type === "cowcentrated" ? "beefy_clm" : protocol_map[vault.platformId]
    if (protocol_type === "beefy_clm_vault") {
      throw new Error("Invalid protocol")
    }
    const reward_pools = clmRewardPoolDataPerClmAddress[vault_address] ?? []

    const boosts = boostPerUnderlyingAddress[vault_address] ?? []

    return {
      id: vault.id,
      vault_address,
      chain: vault.chain,
      vault_token_symbol: vault.earnedToken,
      eol: vault.status === "eol",
      protocol_type,
      platformId: vault.platformId,
      strategy_address: vault.strategy.toLocaleLowerCase() as Hex,
      undelying_lp_address,
      tvl: tvlData[vault.id] ?? 0,
      reward_pools: reward_pools.map((pool) => ({
        id: pool.id,
        clm_address: pool.tokenAddress.toLocaleLowerCase() as Hex,
        reward_pool_address: pool.earnContractAddress.toLocaleLowerCase() as Hex,
      })),
      boosts: boosts.map((boost) => ({
        id: boost.id,
        boost_address: boost.earnedTokenAddress.toLocaleLowerCase() as Hex,
        underlying_address: boost.tokenAddress.toLocaleLowerCase() as Hex,
      })),
      pointStructureIds: vault.pointStructureIds ?? [],
    }
  })

  const mooVaultCofigs = mooVaultsData.map((vault): BeefyVault => {
    let underlying_lp_address = vault.tokenAddress?.toLocaleLowerCase() as Hex | undefined
    const vault_address = vault.earnedTokenAddress.toLocaleLowerCase() as Hex

    const protocol_type: BeefyProtocolType | undefined =
      underlying_lp_address && clmManagerAddresses.has(underlying_lp_address) ? "beefy_clm_vault" : protocol_map[vault.platformId]

    const additionalConfig =
      protocol_type === "beefy_clm_vault"
        ? {
            protocol_type,
            platformId: vault.platformId,
            beefy_clm_manager: clmVaultConfigs.find((v) => v.vault_address === underlying_lp_address) as BeefyVault,
          }
        : { protocol_type, platformId: vault.platformId }
    const reward_pools = vaultRewardPoolDataPerVaultAddress[vault_address] ?? []
    const boosts = boostPerUnderlyingAddress[vault_address] ?? []
    return {
      id: vault.id,
      vault_address,
      chain: vault.chain,
      vault_token_symbol: vault.earnedToken,
      eol: vault.status === "eol",
      ...additionalConfig,
      strategy_address: vault.strategy.toLocaleLowerCase() as Hex,
      undelying_lp_address: underlying_lp_address,
      tvl: tvlData[vault.id] ?? 0,
      reward_pools: reward_pools.map((pool) => ({
        id: pool.id,
        clm_address: pool.tokenAddress.toLocaleLowerCase() as Hex,
        reward_pool_address: pool.earnContractAddress.toLocaleLowerCase() as Hex,
      })),
      boosts: boosts.map((boost) => ({
        id: boost.id,
        boost_address: boost.earnedTokenAddress.toLocaleLowerCase() as Hex,
        underlying_address: boost.tokenAddress.toLocaleLowerCase() as Hex,
      })),
      pointStructureIds: vault.pointStructureIds ?? [],
    }
  })

  const allConfigs = clmVaultConfigs.concat(mooVaultCofigs)

  const countsPerToken = holderCountsData.reduce(
    (acc, { chain, token_address, holder_count }) => {
      const key = `${chain}:${token_address}`
      acc[key] = holder_count
      return acc
    },
    {} as Record<string, number>,
  )

  const dataFileContentPerChain = {} as any

  // check for missing holder counts
  const missingHolderCounts: BeefyVault[] = []
  for (const vault of allConfigs) {
    const subgraphchain = vault.chain === "one" ? "harmony" : vault.chain
    dataFileContentPerChain[subgraphchain] = dataFileContentPerChain[subgraphchain] || { old_vaults: [], old_boosts: [] }

    const level = vault.eol ? "ERROR" : "WARN"
    if (!countsPerToken[`${subgraphchain}:${vault.vault_address}`]) {
      console.error(`${level}: Missing holder count for ${vault.id} with address ${subgraphchain}:${vault.vault_address}`)
      missingHolderCounts.push(vault)
      dataFileContentPerChain[subgraphchain].old_vaults.push(vault.vault_address)
    }
    if (vault.protocol_type === "beefy_clm_vault") {
      if (!countsPerToken[`${subgraphchain}:${vault.beefy_clm_manager.vault_address}`]) {
        console.error(`${level}: Missing holder count for ${vault.id} with CLM address ${subgraphchain}:${vault.beefy_clm_manager.vault_address}`)
        missingHolderCounts.push(vault)
        dataFileContentPerChain[subgraphchain].old_vaults.push(vault.beefy_clm_manager.vault_address)
      }
    }
    for (const pool of vault.reward_pools) {
      if (!countsPerToken[`${subgraphchain}:${pool.clm_address}`]) {
        console.error(`${level}: Missing holder count for ${vault.id}'s Reward Pool with address ${subgraphchain}:${pool.reward_pool_address}`)
        missingHolderCounts.push(vault)
        dataFileContentPerChain[subgraphchain].old_boosts.push(pool.reward_pool_address)
      }
    }
    for (const boost of vault.boosts) {
      if (!countsPerToken[`${subgraphchain}:${boost.underlying_address}`]) {
        console.error(`${level}: Missing holder count for ${vault.id}'s BOOST with address ${subgraphchain}:${boost.boost_address}`)
        missingHolderCounts.push(vault)
        dataFileContentPerChain[subgraphchain].old_boosts.push(boost.boost_address)
      }
    }
  }

  // write data files
  for (const chain of Object.keys(dataFileContentPerChain)) {
    const fs = require("fs")

    // only if the chain has a config file
    if (!fs.existsSync(`./config/${chain}.json`)) {
      continue
    }

    const targetFile = `./data/${chain}_data.json`
    const dataFileContent = dataFileContentPerChain[chain]
    const existingDataFileContentIfAny = fs.existsSync(targetFile)
      ? JSON.parse(fs.readFileSync(targetFile, "utf8"))
      : { old_vaults: [], old_boosts: [] }

    dataFileContent.old_vaults = dataFileContent.old_vaults.concat(existingDataFileContentIfAny.old_vaults)
    dataFileContent.old_boosts = dataFileContent.old_boosts.concat(existingDataFileContentIfAny.old_boosts)
    dataFileContent.old_vaults = Array.from(new Set(dataFileContent.old_vaults))
    dataFileContent.old_boosts = Array.from(new Set(dataFileContent.old_boosts))

    dataFileContent.old_vaults.sort()
    dataFileContent.old_boosts.sort()

    fs.writeFileSync(targetFile, JSON.stringify(dataFileContent, null, 2))
  }

  // display top 30 missing TVL to focus on the most important vaults
  missingHolderCounts.sort((a, b) => b.tvl - a.tvl)
  console.error(`\n\nMissing TVL for top 30 vaults:`)
  missingHolderCounts.slice(0, 100).forEach((v) => {
    const level = v.eol ? "ERROR" : "WARN"
    console.error(`${level}: Missing TVL for ${v.chain}:${v.id}:${v.vault_address}: ${v.tvl}`)
  })
}

main()
