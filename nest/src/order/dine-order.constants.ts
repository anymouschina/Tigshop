// Dine-order related enums & helpers
export enum ServiceState {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum LogEvent {
  CREATE = 'CREATE',
  APPEND = 'APPEND',
  CHANGE_TABLE = 'CHANGE_TABLE',
  STATE_CHANGE = 'STATE_CHANGE',
  PAY = 'PAY',
  CANCEL = 'CANCEL',
}

// Legacy numeric order_status mapping suggestion (can be refined):
// 0 PENDING(unpaid), 1 CONFIRMED/PROCESSING, 4 CANCELED, 5 COMPLETED
export const ServiceStateToOrderStatus: Record<ServiceState, number> = {
  [ServiceState.CREATED]: 0,
  [ServiceState.IN_PROGRESS]: 1,
  [ServiceState.READY]: 1,
  [ServiceState.SERVED]: 1,
  [ServiceState.COMPLETED]: 5,
  [ServiceState.CANCELED]: 4,
};

export const AllowedTransitions: Record<ServiceState, ServiceState[]> = {
  [ServiceState.CREATED]: [ServiceState.IN_PROGRESS, ServiceState.CANCELED],
  [ServiceState.IN_PROGRESS]: [ServiceState.READY, ServiceState.CANCELED],
  [ServiceState.READY]: [ServiceState.SERVED, ServiceState.CANCELED],
  [ServiceState.SERVED]: [ServiceState.COMPLETED, ServiceState.CANCELED],
  [ServiceState.COMPLETED]: [],
  [ServiceState.CANCELED]: [],
};

export function isTerminal(state: ServiceState) {
  return state === ServiceState.COMPLETED || state === ServiceState.CANCELED;
}

export function extractServiceState(extension: any): ServiceState {
  const s = (extension?.serviceState || ServiceState.CREATED) as ServiceState;
  return s in ServiceStateToOrderStatus ? s : ServiceState.CREATED;
}
