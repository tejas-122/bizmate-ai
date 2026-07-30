export const staffRoles = Object.freeze({
  owner: 'owner',
  manager: 'manager',
  cashier: 'cashier',
  inventoryManager: 'inventoryManager',
  accountant: 'accountant',
});

export function staffFromFirestore(documentSnapshot) {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    shopId: data.shopId,
    fullName: data.fullName,
    role: data.role,
    email: data.email ?? null,
    phoneNumber: data.phoneNumber ?? null,
    dailyWage: Number(data.dailyWage ?? 0),
    joinedAt: data.joinedAt?.toDate?.() ?? new Date(),
    isActive: Boolean(data.isActive),
  };
}
