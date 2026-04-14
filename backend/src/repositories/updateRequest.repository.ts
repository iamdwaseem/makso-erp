import { PrismaClient, Prisma, UpdateRequest, UpdateRequestStatus } from "@prisma/client";

export class UpdateRequestRepository {
  constructor(
    private prisma: PrismaClient | Prisma.TransactionClient,
    private organizationId: string
  ) {}

  async create(data: {
    entity_type: "product" | "variant";
    entity_id: string;
    requested_changes: object;
    requested_by: string;
  }): Promise<UpdateRequest> {
    return (this.prisma as any).updateRequest.create({
      data: {
        organization_id: this.organizationId,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        requested_changes: data.requested_changes as any,
        requested_by: data.requested_by,
        status: "pending",
      },
    });
  }

  async findById(id: string): Promise<UpdateRequest | null> {
    return (this.prisma as any).updateRequest.findFirst({
      where: { id, organization_id: this.organizationId },
    });
  }

  async findPending(): Promise<UpdateRequest[]> {
    return (this.prisma as any).updateRequest.findMany({
      where: { organization_id: this.organizationId, status: "pending" },
      orderBy: { created_at: "asc" },
    });
  }

  async updateStatus(id: string, status: UpdateRequestStatus, reviewed_by: string | null): Promise<UpdateRequest> {
    return (this.prisma as any).updateRequest.update({
      where: { id, organization_id: this.organizationId },
      data: { status, reviewed_by },
    });
  }
}
