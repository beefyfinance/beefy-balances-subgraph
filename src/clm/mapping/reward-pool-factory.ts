import { ProxyCreated as RewardPoolCreatedEvent } from "../../../generated/RewardPoolFactory/RewardPoolFactory"
import { ClmRewardPool as ClmRewardPoolTemplate } from "../../../generated/templates"
import { markContractDiscoveredFromFactory } from "../../common/entity/contract"

export function handleRewardPoolCreated(event: RewardPoolCreatedEvent): void {
  const address = event.params.proxy
  ClmRewardPoolTemplate.create(address)
  markContractDiscoveredFromFactory(address)
}
