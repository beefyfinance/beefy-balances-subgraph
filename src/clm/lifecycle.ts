import { ProxyCreated as CLMManagerCreatedEvent } from "../../generated/ClmManagerFactory/ClmManagerFactory"
import { ProxyCreated as RewardPoolCreatedEvent } from "../../generated/RewardPoolFactory/RewardPoolFactory"
import { Initialized as ClmManagerInitializedEvent } from "../../generated/ClmManagerFactory/ClmManager"
import { Initialized as RewardPoolInitializedEvent } from "../../generated/RewardPoolFactory/RewardPool"
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

export function handleClmManagerInitialized(event: ClmManagerInitializedEvent): void {
  const address = event.address
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}

export function handleRewardPoolInitialized(event: RewardPoolInitializedEvent): void {
  const address = event.address
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}
