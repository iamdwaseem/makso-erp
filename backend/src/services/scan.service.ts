import { ScanRepository } from "../repositories/scan.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { ScanInput } from "../validators/scan.validator.js";

const scanRepository = new ScanRepository();
const variantRepository = new VariantRepository();

export class ScanService {
  async processScan(data: ScanInput) {
    const variant = await variantRepository.findBySku(data.sku);

    if (!variant) {
      throw new Error("Variant not found for the given SKU");
    }

    return scanRepository.processScan(data);
  }
}
