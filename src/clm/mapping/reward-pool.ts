import { Initialized as RewardPoolInitializedEvent } from "../../../generated/RewardPoolFactory/RewardPool"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"

export function handleRewardPoolInitialized(event: RewardPoolInitializedEvent): void {
  const address = event.address
  BeefyERC20ProductTemplate.create(address)
}
