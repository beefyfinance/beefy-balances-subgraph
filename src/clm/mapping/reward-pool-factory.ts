import { ProxyCreated as RewardPoolCreatedEvent } from "../../../generated/RewardPoolFactory/RewardPoolFactory"
import { ClmRewardPool as ClmRewardPoolTemplate } from "../../../generated/templates"

export function handleRewardPoolCreated(event: RewardPoolCreatedEvent): void {
  const address = event.params.proxy
  ClmRewardPoolTemplate.create(address)
}
