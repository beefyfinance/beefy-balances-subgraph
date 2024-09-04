import { Initialized as VaultInitialized } from "../../../generated/ClassicVaultFactory/ClassicVault"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"

export function handleClassicVaultInitialized(event: VaultInitialized): void {
  const address = event.address
  BeefyERC20ProductTemplate.create(address)
}
