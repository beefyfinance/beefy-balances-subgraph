import { BoostDeployed as BoostCreated } from "../../../generated/ClassicBoostFactory/ClassicBoostFactory"
import { markContractDiscoveredFromFactory } from "../../common/entity/contract"
import { addIgnoredContract } from "../../common/entity/ignored"

export function handleClassicBoostCreated(event: BoostCreated): void {
  const address = event.params.boost
  addIgnoredContract(address)
  markContractDiscoveredFromFactory(address)
}
