import { ProxyCreated as CLMManagerCreatedEvent } from "../../../generated/ClmManagerFactory/ClmManagerFactory"
import { ClmManager as ClmManagerTemplate } from "../../../generated/templates"

export function handleClmManagerCreated(event: CLMManagerCreatedEvent): void {
  const address = event.params.proxy
  ClmManagerTemplate.create(address)
}
