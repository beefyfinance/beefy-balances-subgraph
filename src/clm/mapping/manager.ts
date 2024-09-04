import { Initialized as ClmManagerInitializedEvent } from "../../../generated/ClmManagerFactory/ClmManager"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"

export function handleClmManagerInitialized(event: ClmManagerInitializedEvent): void {
  const address = event.address
  BeefyERC20ProductTemplate.create(address)
}
