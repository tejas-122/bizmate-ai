export function inventoryItemFromFirestore(documentSnapshot) {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    shopId: data.shopId,
    name: data.name,
    sku: data.sku,
    quantity: Number(data.quantity),
    purchasePrice: Number(data.purchasePrice),
    sellingPrice: Number(data.sellingPrice),
    reorderLevel: data.reorderLevel ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}
