import { ProxyCreated as CLMManagerCreatedEvent } from "../../generated/ClmManagerFactory/ClmManagerFactory"
import { ProxyCreated as RewardPoolCreatedEvent } from "../../generated/RewardPoolFactory/RewardPoolFactory"
import {
  ClmManager as ClmManagerTemplate,
  ClmRewardPool as ClmRewardPoolTemplate,
  BeefyERC20Product as BeefyERC20ProductTemplate,
} from "../../generated/templates"
import { fetchAndSaveTokenData } from "../common/utils/token"

export function handleClmManagerCreated(event: CLMManagerCreatedEvent): void {
  const address = event.params.proxy
  ClmManagerTemplate.create(address)
}

export function handleRewardPoolCreated(event: RewardPoolCreatedEvent): void {
  const address = event.params.proxy
  ClmRewardPoolTemplate.create(address)
}

export function handleClmManagerInitialized(event: CLMManagerCreatedEvent): void {
  const address = event.params.proxy
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}

export function handleRewardPoolInitialized(event: RewardPoolCreatedEvent): void {
  const address = event.params.proxy
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}
