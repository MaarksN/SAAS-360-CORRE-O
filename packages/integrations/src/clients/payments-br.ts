import { getJson, postJson } from "./http";

export interface PaymentCustomer {
  name: string;
  email: string;
  document: string; // CPF or CNPJ
  phone?: string;
}

export interface PaymentResponse {
  id: string;
  status: string;
  amount: number;
  qrCode?: string;
  qrCodeUrl?: string;
  boletoUrl?: string;
  barCode?: string;
  gatewayId?: string;
}

export interface IPaymentsClient {
  generatePix(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
  ): Promise<PaymentResponse>;

  generateBoleto(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
    dueDate: Date,
  ): Promise<PaymentResponse>;

  confirmPayment(paymentId: string, tenantId: string): Promise<PaymentResponse>;
}

interface PagarmeTransaction {
  amount?: number;
  line?: string;
  qr_code?: string;
  qr_code_url?: string;
  url?: string;
}

interface PagarmeCharge {
  id: string;
  last_transaction?: PagarmeTransaction;
  status: string;
}

interface PagarmeOrderResponse {
  charges: PagarmeCharge[];
  id: string;
}

export class PagarmeClient implements IPaymentsClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.pagar.me/core/v5",
  ) {}

  private buildHeaders(tenantId?: string): Record<string, string> {
    return {
      Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
      ...(tenantId ? { "x-birthub-tenant-id": tenantId } : {}),
    };
  }

  private mapPaymentResponse(response: PagarmeOrderResponse, fallbackAmount: number): PaymentResponse {
    const charge = response.charges[0];
    const transaction = charge?.last_transaction;

    return {
      id: response.id,
      status: charge?.status ?? "unknown",
      amount: transaction?.amount ? transaction.amount / 100 : fallbackAmount,
      ...(charge?.id ? { gatewayId: charge.id } : {}),
      ...(transaction?.line ? { barCode: transaction.line } : {}),
      ...(transaction?.url ? { boletoUrl: transaction.url } : {}),
      ...(transaction?.qr_code ? { qrCode: transaction.qr_code } : {}),
      ...(transaction?.qr_code_url ? { qrCodeUrl: transaction.qr_code_url } : {}),
    };
  }

  async generatePix(
    amount: number,
    description: string,
    tenantId: string, // Pagar.me usually uses customer_id or metadata for tenant
    customer: PaymentCustomer,
  ): Promise<PaymentResponse> {
    const payload = {
      items: [
        {
          amount: Math.round(amount * 100), // Pagar.me uses cents
          description,
          quantity: 1,
          code: "1",
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document,
        type: customer.document.length > 11 ? "company" : "individual",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: customer.phone?.slice(0, 2) || "11",
            number: customer.phone?.slice(2) || "999999999",
          },
        },
      },
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: 3600,
          },
        },
      ],
      metadata: {
        tenantId,
      },
    };

    const response = await postJson<PagarmeOrderResponse>(`${this.baseUrl}/orders`, payload, {
      headers: this.buildHeaders(tenantId),
    });
    return this.mapPaymentResponse(response, amount);
  }

  async generateBoleto(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
    dueDate: Date,
  ): Promise<PaymentResponse> {
    const payload = {
      items: [
        {
          amount: Math.round(amount * 100),
          description,
          quantity: 1,
          code: "1",
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document,
        type: customer.document.length > 11 ? "company" : "individual",
      },
      payments: [
        {
          payment_method: "boleto",
          boleto: {
            due_at: dueDate.toISOString(),
            instructions: "Não receber após o vencimento",
          },
        },
      ],
      metadata: {
        tenantId,
      },
    };

    const response = await postJson<PagarmeOrderResponse>(`${this.baseUrl}/orders`, payload, {
      headers: this.buildHeaders(tenantId),
    });
    return this.mapPaymentResponse(response, amount);
  }

  async confirmPayment(
    paymentId: string,
    tenantId: string,
  ): Promise<PaymentResponse> {
    const response = await getJson<PagarmeOrderResponse>(
      `${this.baseUrl}/orders/${encodeURIComponent(paymentId)}`,
      {
        headers: this.buildHeaders(tenantId),
      },
    );

    return this.mapPaymentResponse(response, 0);
  }
}
