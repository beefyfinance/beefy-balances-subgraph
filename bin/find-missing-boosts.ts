import * as fs from "fs"
import * as path from "path"

const CONFIG_DIR = path.join(__dirname, "..", "config")
const DATA_DIR = path.join(__dirname, "..", "data")

function getAvailableChains(): string[] {
  return fs
    .readdirSync(CONFIG_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""))
    .sort()
}

function getExistingNoFactoryBoosts(chain: string): string[] {
  const dataFilePath = path.join(DATA_DIR, `${chain}_data.json`)

  try {
    if (!fs.existsSync(dataFilePath)) {
      return []
    }

    const dataContent = fs.readFileSync(dataFilePath, "utf8")
    const data = JSON.parse(dataContent)

    if (!data.no_factory_boosts || !Array.isArray(data.no_factory_boosts)) {
      return []
    }

    return data.no_factory_boosts.map((address: string) => address.toLowerCase())
  } catch (error) {
    console.warn(`⚠️  Failed to read ${chain} data file: ${error instanceof Error ? error.message : String(error)}`)
    return []
  }
}

type SubgraphResponse = {
  data: {
    ignoredContracts: { id: string }[]
    tokens: { id: string }[]
  }
}

type PromoConfig = {
  id: string
  title: string
  vaultId: string
  assets: string[]
  tokenAddress: string
  type: string
  version?: number
  contractAddress: string
  partners?: string[]
  campaign?: string
  tag?: {
    text: string
  }
  rewards?: Array<{
    type: string
    address: string
    symbol: string
    decimals: number
    oracleId: string
  }>
}[]

async function fetchSubgraphData(chain: string): Promise<{ ignoredContracts: string[]; tokens: string[] }> {
  const SUBGRAPH_URL = `https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-${chain}/latest/gn`
  const graphqlQuery = {
    query: `
      {
        ignoredContracts(skip: 0, first: 1000) {
          id
        }
        tokens(skip: 0, first: 1000) {
          id
        }
      }
    `,
  }

  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(graphqlQuery),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed for ${chain}: ${response.status} ${response.statusText}`)
  }

  const result: SubgraphResponse = await response.json()

  if (!result.data) {
    throw new Error(`Invalid GraphQL response for ${chain}: missing data field`)
  }

  if (!result.data.ignoredContracts || !result.data.tokens) {
    throw new Error(`Invalid GraphQL response for ${chain}: missing ignoredContracts or tokens field`)
  }

  if (result.data.ignoredContracts.length === 1000 && result.data.tokens.length === 1000) {
    throw new Error(`Invalid GraphQL response for ${chain}: more than 1000 ignoredContracts or tokens`)
  }

  return {
    ignoredContracts: result.data.ignoredContracts.map((contract) => contract.id.toLowerCase()),
    tokens: result.data.tokens.map((token) => token.id.toLowerCase()),
  }
}

async function fetchPromoConfig(chain: string): Promise<string[]> {
  const PROMO_CONFIG_URL = `https://raw.githubusercontent.com/beefyfinance/beefy-v2/refs/heads/main/src/config/promos/chain/${chain}.json`

  const response = await fetch(PROMO_CONFIG_URL)

  if (!response.ok) {
    console.warn(`REST request failed for ${chain}: ${response.status} ${response.statusText}`)
    return []
  }

  const promoConfig: PromoConfig = await response.json()

  // Extract all contractAddress fields and convert to lowercase for comparison
  const contractAddresses = promoConfig.filter((item) => item.contractAddress).map((item) => item.contractAddress.toLowerCase())

  return Array.from(new Set(contractAddresses))
}

async function checkChain(chain: string): Promise<{ chain: string; missingAddresses: string[]; totalPromoAddresses: number; error?: string }> {
  try {
    console.log(`📡 Fetching ${chain} subgraph data from Goldsky...`)
    const subgraphData = await fetchSubgraphData(chain)

    console.log(`📥 Fetching ${chain} promo config from GitHub...`)
    const contractAddresses = await fetchPromoConfig(chain)

    // If no promo config exists for this chain, skip it
    if (contractAddresses.length === 0) {
      console.log(`⏭️  No promo config found for ${chain}, skipping...`)
      return {
        chain,
        missingAddresses: [],
        totalPromoAddresses: 0,
      }
    }

    console.log(`📄 Reading ${chain} existing data file...`)
    const existingNoFactoryBoosts = getExistingNoFactoryBoosts(chain)

    // Combine ignored contracts and tokens into one set for comparison
    const knownAddresses = new Set([...subgraphData.ignoredContracts, ...subgraphData.tokens])

    // Find contract addresses that are NOT in the subgraph (tokens or ignoredContracts)
    const missingFromSubgraph = contractAddresses.filter((address) => !knownAddresses.has(address))

    // Filter out addresses that are already in the no_factory_boosts array
    const missingAddresses = missingFromSubgraph.filter((address) => !existingNoFactoryBoosts.includes(address))

    return { chain, missingAddresses, totalPromoAddresses: contractAddresses.length }
  } catch (error) {
    return { chain, missingAddresses: [], totalPromoAddresses: 0, error: error instanceof Error ? error.message : String(error) }
  }
}

async function main() {
  console.log("🔍 Discovering available chains...")
  const chains = getAvailableChains()
  console.log(`📋 Found ${chains.length} chains: ${chains.join(", ")}`)
  console.log(`\n🚀 Checking missing boosts across ${chains.length} chains...\n`)

  const results: Array<{ chain: string; missingAddresses: string[]; totalPromoAddresses: number; error?: string }> = []

  // Check all chains sequentially to avoid overwhelming the APIs
  for (const chain of chains) {
    const result = await checkChain(chain)
    results.push(result)

    // Add a small delay between requests to be respectful to the APIs
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Display results
  console.log("\n" + "=".repeat(100))
  console.log("🏁 FINAL ANALYSIS RESULTS")
  console.log("=".repeat(100))

  let totalMissing = 0
  let successfulChains = 0
  let errorChains = 0
  let chainsWithoutPromos = 0

  for (const result of results) {
    console.log(`\n📊 Chain: ${result.chain.toUpperCase()}`)
    console.log("-".repeat(40))

    if (result.error) {
      console.log(`❌ Error: ${result.error}`)
      errorChains++
    } else if (result.totalPromoAddresses === 0) {
      console.log("ℹ️  No promo config found for this chain")
      chainsWithoutPromos++
    } else if (result.missingAddresses.length === 0) {
      console.log(`✅ All ${result.totalPromoAddresses} contract addresses are covered (subgraph + no_factory_boosts)`)
      successfulChains++
    } else {
      console.log(`🚨 Found ${result.missingAddresses.length} missing contract address(es) out of ${result.totalPromoAddresses} total:`)
      console.log(`   (These are NOT in subgraph AND NOT in no_factory_boosts array)`)
      result.missingAddresses.forEach((address) => {
        console.log(`   "${address}",`)
      })
      totalMissing += result.missingAddresses.length
      successfulChains++
    }
  }

  // Summary
  console.log("\n" + "=".repeat(100))
  console.log("📈 SUMMARY")
  console.log("=".repeat(100))
  console.log(`✅ Successfully checked: ${successfulChains} chains`)
  console.log(`❌ Failed to check: ${errorChains} chains`)
  console.log(`ℹ️  Chains without promo configs: ${chainsWithoutPromos} chains`)
  console.log(`🚨 Total missing contracts (need to be added to no_factory_boosts): ${totalMissing}`)

  if (totalMissing === 0 && errorChains === 0) {
    console.log("\n🎉 Perfect! All chains have all their boost contracts properly covered!")
    console.log("    (Either in subgraph OR in no_factory_boosts array)")
  } else if (errorChains > 0) {
    console.log(`\n⚠️  Some chains failed to check. Please investigate the errors above.`)
  } else if (totalMissing > 0) {
    console.log(`\n📝 Action needed: Add the missing ${totalMissing} contract(s) to the no_factory_boosts arrays in the respective data files.`)
  }
}

// Run the script
main()
