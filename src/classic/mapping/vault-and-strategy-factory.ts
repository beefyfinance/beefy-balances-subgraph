import { log } from "@graphprotocol/graph-ts"
import { ProxyCreated as VaultOrStrategyCreated } from "../../../generated/ClassicVaultFactory/ClassicVaultFactory"
import { ClassicVault as ClassicVaultContract } from "../../../generated/ClassicVaultFactory/ClassicVault"
import { ClassicVault as ClassicVaultTemplate } from "../../../generated/templates"
import { RANDOM } from "../../random"

export function handleClassicVaultOrStrategyCreated(event: VaultOrStrategyCreated): void {
  log.debug("Classic Vault or Strategy created: {}. Rng: {}", [event.params.proxy.toHexString(), RANDOM])

  const address = event.params.proxy

  // test if we are creating a vault or a strategy
  const vaultContract = ClassicVaultContract.bind(address)
  const vaultStrategyRes = vaultContract.try_strategy()

  // proxy also creates the strategies
  if (vaultStrategyRes.reverted) {
    log.debug("`strategy()` method does not exist on contract: {}. It's not a vault", [address.toHexString()])
  } else {
    log.warning("Creating Classic Vault: {}", [address.toHexString()])

    ClassicVaultTemplate.create(address)
  }
}
