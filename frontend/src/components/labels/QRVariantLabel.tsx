import Barcode from "react-barcode";

interface QRVariantLabelProps {
  variantId: string;
  sku: string;
  productName: string;
}

export function QRVariantLabel({ sku, productName }: QRVariantLabelProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-white w-48 shadow-sm">
      <div className="font-bold text-sm text-center mb-1 text-gray-900 truncate w-full" title={productName}>
        {productName}
      </div>
      <div className="text-xs text-gray-500 font-mono mb-3 truncate w-full text-center" title={sku}>
        {sku}
      </div>
      <div className="p-2 bg-white rounded-lg border flex justify-center">
        <Barcode value={sku} format="CODE128" displayValue={true} width={1.2} height={40} />
      </div>
    </div>
  );
}
