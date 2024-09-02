import { Initialized as RewardPoolInitializedEvent } from "../../../generated/RewardPoolFactory/RewardPool"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"
import { fetchAndSaveTokenData } from "../../common/utils/token"

export function handleRewardPoolInitialized(event: RewardPoolInitializedEvent): void {
  const address = event.address
  fetchAndSaveTokenData(address)
  BeefyERC20ProductTemplate.create(address)
}
