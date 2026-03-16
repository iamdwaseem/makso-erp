import { PrismaClient, Prisma } from "@prisma/client";
import { CreateCreditNoteInput } from "../validators/credit-note.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class CreditNoteRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll(opts: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = opts;
    return this.paginate(
      (this.prisma as any).creditNote,
      this.tenantWhere({}),
      page,
      limit,
      {
        sale: { include: { customer: true, warehouse: true } },
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );
  }

  async findById(id: string) {
    return (this.prisma as any).creditNote.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        sale: { include: { customer: true, warehouse: true, items: true } },
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async create(data: CreateCreditNoteInput) {
    const { items, ...header } = data;
    const creditNote = await (this.prisma as any).creditNote.create({
      data: this.tenantData({
        sale_id: header.sale_id,
        amount: header.amount,
        reason: header.reason ?? null,
        status: "DRAFT",
      }),
    });
    for (const item of items) {
      await (this.prisma as any).creditNoteItem.create({
        data: {
          credit_note_id: creditNote.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        },
      });
    }
    return this.findById(creditNote.id);
  }

  async updateStatus(id: string, status: string) {
    await (this.prisma as any).creditNote.update({
      where: { id },
      data: { status },
    });
  }
}
