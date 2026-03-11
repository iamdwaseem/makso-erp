import { ScanRepository } from "../repositories/scan.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { ScanInput } from "../validators/scan.validator.js";
import { PrismaClient, Prisma } from "@prisma/client";

export class ScanService {
  private scanRepo: ScanRepository;
  private variantRepo: VariantRepository;

  constructor(prisma: PrismaClient | Prisma.TransactionClient, organizationId: string) {
    this.scanRepo = new ScanRepository(prisma, organizationId);
    this.variantRepo = new VariantRepository(prisma, organizationId);
  }

  async processScan(data: ScanInput) {
    return this.scanRepo.processScan(data);
  }
}
