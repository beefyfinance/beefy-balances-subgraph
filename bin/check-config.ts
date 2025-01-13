import { chain, groupBy, uniq } from "lodash"
import { addressBook, Chain as AddressBookChain } from "blockchain-addressbook"

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

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // check for missing chains
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const missingChains: string[] = []
  const allChains = uniq(allConfigs.map((v) => v.chain))
  for (const chain of allChains) {
    const fs = require("fs")

    // only if the chain has a config file
    if (!fs.existsSync(`./config/${chain}.json`)) {
      missingChains.push(chain)
    }
  }
  if (missingChains.length > 0) {
    console.error(`Missing chains: ${missingChains.join(", ")}`)
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // check for missing holder counts
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const missingHolderCounts: BeefyVault[] = []
  for (const vault of allConfigs) {
    if (missingChains.includes(vault.chain)) {
      continue
    }

    const subgraphchain = vault.chain === "one" ? "harmony" : vault.chain
    dataFileContentPerChain[subgraphchain] = dataFileContentPerChain[subgraphchain] || { no_factory_vaults: [], no_factory_boosts: [] }

    const level = vault.eol ? "ERROR" : "WARN"
    if (!countsPerToken[`${subgraphchain}:${vault.vault_address}`]) {
      console.error(
        `${level}: Missing holder count in balance api for ${vault.chain}:${vault.id} with address ${subgraphchain}:${vault.vault_address}`,
      )
      missingHolderCounts.push(vault)
      dataFileContentPerChain[subgraphchain].no_factory_vaults.push(vault.vault_address)
    }
    if (vault.protocol_type === "beefy_clm_vault") {
      if (!countsPerToken[`${subgraphchain}:${vault.beefy_clm_manager.vault_address}`]) {
        console.error(
          `${level}: Missing holder count in balance api for ${vault.chain}:${vault.id} with CLM address ${subgraphchain}:${vault.beefy_clm_manager.vault_address}`,
        )
        missingHolderCounts.push(vault)
        dataFileContentPerChain[subgraphchain].no_factory_vaults.push(vault.beefy_clm_manager.vault_address)
      }
    }
    for (const pool of vault.reward_pools) {
      if (!countsPerToken[`${subgraphchain}:${pool.clm_address}`]) {
        console.error(
          `${level}: Missing holder count in balance api for ${vault.chain}:${vault.id}'s Reward Pool with address ${subgraphchain}:${pool.reward_pool_address}`,
        )
        missingHolderCounts.push(vault)
        dataFileContentPerChain[subgraphchain].no_factory_boosts.push(pool.reward_pool_address)
      }
    }
    for (const boost of vault.boosts) {
      if (!countsPerToken[`${subgraphchain}:${boost.underlying_address}`]) {
        console.error(
          `${level}: Missing holder count in balance api for ${vault.chain}:${vault.id}'s BOOST with address ${subgraphchain}:${boost.boost_address}`,
        )
        missingHolderCounts.push(vault)
        dataFileContentPerChain[subgraphchain].no_factory_boosts.push(boost.boost_address)
      }
    }
  }

  // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // // write data files with missing holder counts
  // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
      : { no_factory_vaults: [], no_factory_boosts: [] }

    dataFileContent.no_factory_vaults = dataFileContent.no_factory_vaults.concat(existingDataFileContentIfAny.no_factory_vaults)
    dataFileContent.no_factory_boosts = dataFileContent.no_factory_boosts.concat(existingDataFileContentIfAny.no_factory_boosts)
    dataFileContent.no_factory_vaults = Array.from(new Set(dataFileContent.no_factory_vaults))
    dataFileContent.no_factory_boosts = Array.from(new Set(dataFileContent.no_factory_boosts))

    dataFileContent.no_factory_vaults.sort()
    dataFileContent.no_factory_boosts.sort()

    fs.writeFileSync(targetFile, JSON.stringify(dataFileContent, null, 2))
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // display top 30 missing TVL to focus on the most important vaults
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // display top 30 missing TVL to focus on the most important vaults
  missingHolderCounts.sort((a, b) => b.tvl - a.tvl)
  console.error(`\n\nMissing TVL for top 30 vaults:`)
  missingHolderCounts.slice(0, 100).forEach((v) => {
    const level = v.eol ? "ERROR" : "WARN"
    console.error(`${level}: Missing TVL for ${v.chain}:${v.id}:${v.vault_address}: ${v.tvl}`)
  })

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // check that the chain config contains all the factory addresses in the addressbook
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const uniqChains = Array.from(new Set(allConfigs.map((v) => v.chain)))
  for (const chain of uniqChains) {
    const fs = require("fs")

    // only if the chain has a config file
    if (!fs.existsSync(`./config/${chain}.json`)) {
      continue
    }

    const file = `./config/${chain}.json`
    const config = JSON.parse(fs.readFileSync(file, "utf8"))
    type BeefyConfig = AddressBookChain["platforms"]["beefyfinance"]
    // @ts-ignore
    const addressbookChainConfig: BeefyConfig = addressBook[chain as any].platforms.beefyfinance

    // clm
    if (
      addressbookChainConfig.clmFactory?.toLowerCase() !== config.clmManagerFactoryAddress?.toLowerCase() &&
      addressbookChainConfig.clmFactory?.toLowerCase() !== config.clmManagerFactoryAddress_2?.toLowerCase()
    ) {
      console.error(
        `${chain}: clmFactory address mismatch in config: ${addressbookChainConfig.clmFactory} !== ${config.clmManagerFactoryAddress} or ${config.clmManagerFactoryAddress_2}`,
      )
    }
    if (
      addressbookChainConfig.clmStrategyFactory?.toLowerCase() !== config.clmStrategyFactoryAddress?.toLowerCase() &&
      addressbookChainConfig.clmStrategyFactory?.toLowerCase() !== config.clmStrategyFactoryAddress_2?.toLowerCase()
    ) {
      console.error(
        `${chain}: clmStrategyFactory address mismatch in config: ${addressbookChainConfig.clmStrategyFactory} !== ${config.clmStrategyFactoryAddress} or ${config.clmStrategyFactoryAddress_2}`,
      )
    }
    if (
      addressbookChainConfig.clmRewardPoolFactory?.toLowerCase() !== config.rewardPoolFactoryAddress?.toLowerCase() &&
      addressbookChainConfig.clmRewardPoolFactory?.toLowerCase() !== config.rewardPoolFactoryAddress_2?.toLowerCase()
    ) {
      console.error(
        `${chain}: clmRewardPoolFactory address mismatch in config: ${addressbookChainConfig.clmRewardPoolFactory} !== ${config.rewardPoolFactoryAddress} or ${config.rewardPoolFactoryAddress_2}`,
      )
    }

    // beefy classic
    if (
      addressbookChainConfig.vaultFactory?.toLowerCase() !== config.beefyClassicVaultFactoryAddress?.toLowerCase() &&
      addressbookChainConfig.vaultFactory?.toLowerCase() !== config.beefyClassicVaultFactoryAddress_2?.toLowerCase()
    ) {
      console.error(
        `${chain}: vaultFactory address mismatch in config: ${addressbookChainConfig.vaultFactory} !== ${config.beefyClassicVaultFactoryAddress} or ${config.beefyClassicVaultFactoryAddress_2}`,
      )
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // check that reward pools are never considered as boosts in data files
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  for (const chain of uniqChains) {
    const fs = require("fs")
    if (!fs.existsSync(`./data/${chain}_data.json`)) {
      continue
    }
    const data = JSON.parse(fs.readFileSync(`./data/${chain}_data.json`, "utf8"))

    for (const potentially_a_misclassified_boost_address of data.no_factory_boosts) {
      const rewardPool = clmRewardPoolData.find(
        (r) => r.earnContractAddress.toLowerCase() === potentially_a_misclassified_boost_address.toLowerCase(),
      )
      if (rewardPool) {
        console.error(`${chain}:${potentially_a_misclassified_boost_address} is a reward pool but is considered as a boost in data file`)
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // check contracts in data files are not discovered from factory as well
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  for (const chain of uniqChains) {
    const fs = require("fs")
    if (!fs.existsSync(`./data/${chain}_data.json`)) {
      continue
    }
    const dataConfig = JSON.parse(fs.readFileSync(`./data/${chain}_data.json`, "utf8"))
    const allAddressesInDataConfig = [...dataConfig.no_factory_vaults, ...dataConfig.no_factory_boosts]

    const gql = `
      query Misconfig {
        duplicate_config: contracts(where: {
          factory: true,
          config: true,
        }) {
          id
        }
        
        none_config: contracts(where: {
          factory: false,
          config: false,
        }) {
          id
        }
      }
    `

    // only use the next version of the subgraph
    const subgraphUrl = `https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-${chain}/next/gn`
    const result = await fetch(subgraphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql }),
    })

    if (!result.ok) {
      console.error(`Failed to fetch data from ${subgraphUrl} subgraph ${chain} (${result.statusText}): ${gql}`)
      console.error(await result.text())
      continue
    }

    const resultData = (await result.json()) as
      | {
          data: {
            duplicate_config: { id: string }[]
            none_config: { id: string }[]
          }
        }
      | { errors: { location: string[]; message: string }[] }

    if ("errors" in resultData) {
      console.error(`Failed to fetch data from ${subgraphUrl} subgraph ${chain} (${result.statusText}): ${gql}`)
      console.error(JSON.stringify(resultData.errors, null, 2))
      continue
    }

    for (const contract of resultData.data.duplicate_config) {
      if (allAddressesInDataConfig.includes(contract.id)) {
        console.error(`${chain}: Contract ${contract.id} is discovered from factory as well`)
      }
    }

    for (const contract of resultData.data.none_config) {
      if (allAddressesInDataConfig.includes(contract.id)) {
        console.error(`${chain}: Contract ${contract.id} is not discovered from factory`)
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // check that no balance is below 0, if that's the case that's probably because "firstBlock" is not set correctly
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  for (const chain of uniqChains) {
    const fs = require("fs")
    if (!fs.existsSync(`./config/${chain}.json`)) {
      continue
    }

    const gql = `{
      tokenBalances(where: {rawAmount_lt: 0}, skip: 0, first: 1000) {
        token {
          id
        }
        amount
        rawAmount
      }
    }`

    // only use the next version of the subgraph
    const subgraphUrl = `https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-${chain}/latest/gn`
    const result = await fetch(subgraphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql }),
    })

    if (!result.ok) {
      console.error(`Failed to fetch data from ${subgraphUrl} subgraph ${chain} (${result.statusText}): ${gql}`)
      console.error(await result.text())
      continue
    }

    const resultData = (await result.json()) as
      | {
          data: {
            tokenBalances: {
              token: {
                id: string
              }
              amount: string
              rawAmount: string
            }[]
          }
        }
      | { errors: { location: string[]; message: string }[] }

    if ("errors" in resultData) {
      console.error(`Failed to fetch data from ${subgraphUrl} subgraph ${chain} (${result.statusText}): ${gql}`)
      console.error(JSON.stringify(resultData.errors, null, 2))
      continue
    }

    if (resultData.data.tokenBalances.length > 0) {
      const duneChain = chain === "bsc" ? "bnb" : chain === "avax" ? "avalanche_c" : chain
      const duneQuery = `
      SELECT to, min(block_number)
      FROM ${duneChain}.transactions
      WHERE ${uniq(resultData.data.tokenBalances.map((t) => t.token.id))
        .map((t) => `to = ${t}`)
        .join("\n OR ")}
      group by to
      order by min(block_number)
      `
      console.error(`${chain}: Found ${resultData.data.tokenBalances.length} token balances with balances below 0, please fix firstBlock in config.
        ${duneQuery}
      `)
    }
  }
}

main()
