import { Address, ethereum, store } from "@graphprotocol/graph-ts"
import { BeefyVaultV7 as BeefyVaultV7Contract, UpgradeStrat } from "../generated/templates/BeefyVaultV7/BeefyVaultV7"
import { BEEFY_VAULT_LIFECYCLE_RUNNING, getBeefyStrategy, getBeefyVault } from "./entity/vault"
import { BeefyIStrategyV7 as BeefyIStrategyV7Template, BeefyVaultV7 as BeefyVaultV7Template } from "../generated/templates"
import { ADDRESS_ZERO } from "./utils/address"
import { BeefyIStrategyV7 as BeefyIStrategyV7Contract } from "../generated/templates/BeefyIStrategyV7/BeefyIStrategyV7"
import { BeefyVault } from "../generated/schema"
import { getTokenAndInitIfNeeded } from "./entity/token"
import { ProxyCreated as VaultCreated } from "../generated/BeefyVaultV7Factory/BeefyVaultV7Factory"
import { log } from "matchstick-as"

export function handleVaultCreated(event: VaultCreated): void {
  // start watching the vault events
  const vaultAddress = event.params.proxy
  log.debug("Vault created: {}", [vaultAddress.toHexString()])

  // test if we are creating a vault or a strategy
  const vaultContract = BeefyVaultV7Contract.bind(vaultAddress)
  const strategyRes = vaultContract.try_strategy()
  // proxy also creates the strategies
  if (strategyRes.reverted) {
    log.warning("`strategy()` method does not exist on contract: {}. It's not a vault", [vaultAddress.toHexString()])
    return
  }

  const vault = getBeefyVault(vaultAddress)
  vault.save()

  BeefyVaultV7Template.create(vaultAddress)
}

export function handleVaultInitialized(event: ethereum.Event): void {
  const vaultAddress = event.address
  log.debug("Vault initialized: {}", [vaultAddress.toHexString()])

  let vault = getBeefyVault(vaultAddress)
  // some chains don't have a proper initialized event so
  // we hook into another event that may trigger multiple times
  if (vault.isInitialized) {
    return
  }

  const vaultContract = BeefyVaultV7Contract.bind(vaultAddress)
  const strategyAddress = vaultContract.strategy()

  vault.isInitialized = true
  vault.strategy = strategyAddress
  vault.initializedAtBlockNumber = event.block.number
  vault.initializedAtTimestamp = event.block.timestamp
  vault.save() // needs to be saved before we can use it in the strategy events

  // we start watching strategy events
  BeefyIStrategyV7Template.create(strategyAddress)

  const strategy = getBeefyStrategy(strategyAddress)
  // the strategy may or may not be initialized
  // this is a test to know if that is the case
  const strategyContract = BeefyIStrategyV7Contract.bind(strategyAddress)
  const strategyVaultRes = strategyContract.try_vault()
  if (strategyVaultRes.reverted) {
    log.warning("strategy not yet initialized or is not a proper strategy: {}", [strategyAddress.toHexString()])
    return
  }
  const strategyVault = strategyVaultRes.value
  strategy.isInitialized = !strategyVault.equals(ADDRESS_ZERO)

  if (strategy.isInitialized) {
    vault = fetchInitialVaultData(vault)
    vault.save()
  }
}

export function handleStrategyInitialized(event: ethereum.Event): void {
  const strategyAddress = event.address
  log.debug("Strategy initialized: {}", [strategyAddress.toHexString()])

  const strategyContract = BeefyIStrategyV7Contract.bind(strategyAddress)
  const vaultAddress = strategyContract.vault()

  const strategy = getBeefyStrategy(strategyAddress)
  strategy.isInitialized = true
  strategy.vault = vaultAddress
  strategy.save()

  let vault = getBeefyVault(vaultAddress)
  if (vault.isInitialized) {
    vault = fetchInitialVaultData(vault)
    vault.save()
  }
}

/**
 * Initialize the vault data.
 * Call this when both the vault and the strategy are initialized.
 */
function fetchInitialVaultData(vault: BeefyVault): BeefyVault {
  const vaultAddress = Address.fromBytes(vault.id)
  const sharesToken = getTokenAndInitIfNeeded(vaultAddress)

  vault.sharesToken = sharesToken.id
  vault.lifecycle = BEEFY_VAULT_LIFECYCLE_RUNNING

  return vault
}

export function handleUpgradeStrat(event: UpgradeStrat): void {
  const vault = getBeefyVault(event.address)
  const newStrategyAddress = event.params.implementation
  const oldStrategyAddress = vault.strategy
  vault.strategy = newStrategyAddress
  vault.save()

  // we start watching the new strategy events
  BeefyIStrategyV7Template.create(newStrategyAddress)

  // create the new strategy entity
  const newStrategy = getBeefyStrategy(newStrategyAddress)
  newStrategy.isInitialized = true
  newStrategy.vault = vault.id
  newStrategy.save()

  // make sure we deprecated the old strategy
  // so events are ignored
  const oldStrategy = getBeefyStrategy(oldStrategyAddress)
  oldStrategy.isInitialized = false
  oldStrategy.vault = ADDRESS_ZERO
  oldStrategy.save()
}
