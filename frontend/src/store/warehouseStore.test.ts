import { describe, expect, it } from "vitest";
import { useWarehouseStore } from "./warehouseStore";

describe("warehouseStore", () => {
  it("sets and clears warehouse state", () => {
    const store = useWarehouseStore.getState();
    store.clearWarehouses();
    expect(useWarehouseStore.getState().currentWarehouseId).toBe("all");
    expect(useWarehouseStore.getState().warehouses).toHaveLength(0);

    store.setWarehouses([
      { id: "w1", name: "Main", code: "M01" },
      { id: "w2", name: "Secondary", code: "S02" },
    ]);
    store.setWarehouse("w2");

    expect(useWarehouseStore.getState().warehouses).toHaveLength(2);
    expect(useWarehouseStore.getState().currentWarehouseId).toBe("w2");

    store.clearWarehouses();
    expect(useWarehouseStore.getState().currentWarehouseId).toBe("all");
  });
});

