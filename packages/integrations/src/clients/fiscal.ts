import { getJson, postJson } from "./http";

export interface FiscalInvoice {
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerAddress: string;
  serviceCode: string; // Código do serviço
  amount: number;
  description: string;
}

export interface FiscalResponse {
  id: string;
  status: string; // authorized, denied, canceled, processing
  nfeUrl?: string;
  nfeKey?: string;
  xmlUrl?: string;
  errors?: string[];
}

export interface IFiscalClient {
  emitNFe(invoice: FiscalInvoice, tenantId: string): Promise<FiscalResponse>;
  cancelNFe(id: string, reason: string): Promise<FiscalResponse>;
  getStatus(id: string): Promise<FiscalResponse>;
}

interface ENotasInvoiceResponse {
  id: string;
  linkPdf?: string;
  linkXml?: string;
  numeroNfse?: string;
  status: string;
}

export class ENotasClient implements IFiscalClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.enotasgw.com.br/v2",
    private readonly companyId = process.env.ENOTAS_COMPANY_ID ?? "default",
  ) {}

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
    };
  }

  private buildCompanyScopedPath(resourcePath: string): string {
    return `${this.baseUrl}/empresas/${encodeURIComponent(this.companyId)}${resourcePath}`;
  }

  private mapFiscalResponse(response: ENotasInvoiceResponse): FiscalResponse {
    return {
      id: response.id,
      status: response.status,
      ...(response.numeroNfse ? { nfeKey: response.numeroNfse } : {}),
      ...(response.linkPdf ? { nfeUrl: response.linkPdf } : {}),
      ...(response.linkXml ? { xmlUrl: response.linkXml } : {}),
    };
  }

  async emitNFe(
    invoice: FiscalInvoice,
    tenantId: string,
  ): Promise<FiscalResponse> {
    const payload = {
      tipo: "NFS-e",
      idExterno: invoice.referenceId,
      status: "emitir",
      cliente: {
        nome: invoice.customerName,
        email: invoice.customerEmail,
        cpfCnpj: invoice.customerDocument,
        endereco: {
          uf: "SP", // Simplification
          cidade: "São Paulo",
          logradouro: invoice.customerAddress,
          numero: "123",
          cep: "01001000",
        },
      },
      servico: {
        descricao: invoice.description,
        cnae: invoice.serviceCode, // CNAE or service item code
        valorTotal: invoice.amount,
      },
      tags: [tenantId],
    };

    const response = await postJson<ENotasInvoiceResponse>(this.buildCompanyScopedPath("/nfs-e"), payload, {
      headers: {
        ...this.buildHeaders(),
        "x-birthub-tenant-id": tenantId,
      },
    });

    return this.mapFiscalResponse(response);
  }

  async cancelNFe(id: string, reason: string): Promise<FiscalResponse> {
    const response = await postJson<ENotasInvoiceResponse>(
      this.buildCompanyScopedPath(`/nfs-e/${encodeURIComponent(id)}/cancelar`),
      { motivo: reason },
      {
        headers: this.buildHeaders(),
      },
    );

    return this.mapFiscalResponse({
      ...response,
      status: response.status || "canceled",
    });
  }

  async getStatus(id: string): Promise<FiscalResponse> {
    const response = await getJson<ENotasInvoiceResponse>(
      this.buildCompanyScopedPath(`/nfs-e/${encodeURIComponent(id)}`),
      {
        headers: this.buildHeaders(),
      },
    );

    return this.mapFiscalResponse(response);
  }
}
