import { getJson, postJson } from "./http";

export interface Signer {
  email: string;
  name: string;
  authMethod?: "email" | "sms" | "whatsapp";
  phoneNumber?: string;
}

export interface SignatureDocument {
  id: string;
  name: string;
  status: string; // running, closed, canceled
  signers: Array<{
    email: string;
    signed: boolean;
    signedAt?: Date;
  }>;
  downloads?: {
    original_file_url?: string;
    signed_file_url?: string;
  };
}

export interface ISignaturesClient {
  createDocument(
    templateId: string,
    signers: Signer[],
    path: string,
    tenantId: string,
  ): Promise<SignatureDocument>;

  sendForSignature(documentId: string): Promise<void>; // Usually automatic in ClickSign upon creation if configured, or specific action
  getStatus(documentId: string): Promise<SignatureDocument>;
}

interface ClickSignSignerResponse {
  email?: string;
  name?: string;
  signed_at?: string | null;
}

interface ClickSignDocumentResponse {
  downloads?: {
    original_file_url?: string;
    signed_file_url?: string;
  };
  filename?: string;
  key?: string;
  list?: {
    signers?: ClickSignSignerResponse[];
  };
  signers?: ClickSignSignerResponse[];
  status?: string;
}

export class ClickSignClient implements ISignaturesClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = "https://app.clicksign.com/api/v1",
  ) {}

  async createDocument(
    templateId: string,
    signers: Signer[],
    path: string, // Directory path in ClickSign
    tenantId: string,
  ): Promise<SignatureDocument> {
    // 1. Create document from template or upload
    // Simplified flow: assume uploading content or using template
    // This example assumes uploading a file (not implemented here fully) or using a template endpoint (not standard in v1 API, usually you upload a PDF).
    // Let's assume we are creating a document by uploading bytes (mocked here) or referencing a template.

    // Mock implementation for structure
    const payload = {
      document: {
        path: path,
        template_ids: [templateId],
      },
      signers: signers.map((s) => ({
        email: s.email,
        name: s.name,
        auths: [s.authMethod || "email"],
        phone_number: s.phoneNumber,
      })),
      metadata: {
        tenantId,
      },
    };

    // Note: ClickSign API is more complex (upload doc, add signers to list, add list to doc).
    // This is a simplified abstraction.

    const response = await postJson<{ document: ClickSignDocumentResponse }>(
      `${this.baseUrl}/documents?access_token=${this.accessToken}`,
      payload,
    );

    return this._mapResponse(response.document);
  }

  async sendForSignature(documentId: string): Promise<void> {
    // ClickSign usually sends automatically when signers are added and document is finished setup.
    // Or we can trigger a notification.
    await postJson(
      `${this.baseUrl}/documents/${documentId}/notifications?access_token=${this.accessToken}`,
      { message: "Please sign this document." },
    );
  }

  async getStatus(documentId: string): Promise<SignatureDocument> {
    const response = await getJson<{ document: ClickSignDocumentResponse }>(
      `${this.baseUrl}/documents/${documentId}?access_token=${this.accessToken}`,
    );

    return this._mapResponse(response.document);
  }

  private _mapResponse(doc: ClickSignDocumentResponse): SignatureDocument {
    const signers = doc.signers ?? doc.list?.signers ?? [];
    const downloads = doc.downloads
      ? {
          ...(doc.downloads.original_file_url
            ? { original_file_url: doc.downloads.original_file_url }
            : {}),
          ...(doc.downloads.signed_file_url
            ? { signed_file_url: doc.downloads.signed_file_url }
            : {}),
        }
      : undefined;

    return {
      id: doc.key ?? "",
      name: doc.filename ?? "",
      signers: signers.map((signer) => ({
        email: signer.email ?? "",
        signed: Boolean(signer.signed_at),
        ...(signer.signed_at ? { signedAt: new Date(signer.signed_at) } : {}),
      })),
      status: doc.status ?? "unknown",
      ...(downloads && Object.keys(downloads).length > 0 ? { downloads } : {}),
    };
  }
}
