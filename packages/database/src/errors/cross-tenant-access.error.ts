export class CrossTenantAccessError extends Error {
  public readonly contextTenantId: string;
  public readonly model: string | undefined;
  public readonly operation: string;
  public readonly requestedTenantId: string;

  constructor(input: {
    contextTenantId: string;
    model?: string;
    operation: string;
    requestedTenantId: string;
  }) {
    super(
      `Blocked cross-tenant database access for '${input.model ? `${input.model}.` : ""}${input.operation}'. Requested tenant '${input.requestedTenantId}' while the active tenant is '${input.contextTenantId}'.`
    );
    this.name = "CrossTenantAccessError";
    this.contextTenantId = input.contextTenantId;
    this.model = input.model;
    this.operation = input.operation;
    this.requestedTenantId = input.requestedTenantId;
  }
}
