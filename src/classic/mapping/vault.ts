import { Initialized as VaultInitializedWithInitialized } from "../../../generated/ClassicVaultFactory/ClassicVault"
import { OwnershipTransferred as VaultInitializedWithOwnershipTransferred } from "../../../generated/ClassicVaultFactory/ClassicVault"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"

export function handleClassicVaultInitializedWithInitialized(event: VaultInitializedWithInitialized): void {
  const address = event.address
  BeefyERC20ProductTemplate.create(address)
}

export function handleClassicVaultInitializedWithOwnershipTransferred(event: VaultInitializedWithOwnershipTransferred): void {
  const address = event.address
  BeefyERC20ProductTemplate.create(address)
}
