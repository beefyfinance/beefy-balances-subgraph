import { ProxyCreated as CLMManagerCreatedEvent } from "../../generated/ClmManagerFactory/ClmManagerFactory"
import { ProxyCreated as RewardPoolCreatedEvent } from "../../generated/RewardPoolFactory/RewardPoolFactory"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../generated/templates"
import { fetchAndSaveTokenData } from "../common/utils/token"

export function handleClmManagerCreated(event: CLMManagerCreatedEvent): void {
  const address = event.params.proxy
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}

export function handleRewardPoolCreated(event: RewardPoolCreatedEvent): void {
  const address = event.params.proxy
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}
