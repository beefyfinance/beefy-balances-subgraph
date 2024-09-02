import { Initialized as ClmManagerInitializedEvent } from "../../../generated/ClmManagerFactory/ClmManager"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"
import { fetchAndSaveTokenData } from "../../common/utils/token"

export function handleClmManagerInitialized(event: ClmManagerInitializedEvent): void {
  const address = event.address
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}
