import { log } from "@graphprotocol/graph-ts"
import { ProxyCreated as VaultOrStrategyCreated } from "../../generated/ClassicVaultFactory/ClassicVaultFactory"
import { BoostDeployed as BoostCreated } from "../../generated/ClassicBoostFactory/ClassicBoostFactory"
import { ClassicVault as ClassicVaultContract } from "../../generated/ClassicVaultFactory/ClassicVault"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../generated/templates"
import { fetchAndSaveTokenData } from "../common/utils/token"

export function handleClassicVaultOrStrategyCreated(event: VaultOrStrategyCreated): void {
  const address = event.params.proxy

  // test if we are creating a vault or a strategy
  const vaultContract = ClassicVaultContract.bind(address)
  const vaultStrategyRes = vaultContract.try_strategy()

  // proxy also creates the strategies
  if (vaultStrategyRes.reverted) {
    log.debug("`strategy()` method does not exist on contract: {}. It's not a vault", [address.toHexString()])
  } else {
    log.info("Creating Classic Vault: {}", [address.toHexString()])

    fetchAndSaveTokenData(address)
    BeefyERC20ProductTemplate.create(address)
  }
}

export function handleClassicBoostCreated(event: BoostCreated): void {
  // TODO: this is wrong
  const address = event.params.boost
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}
