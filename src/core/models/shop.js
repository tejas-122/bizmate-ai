export function shopFromFirestore(documentSnapshot) {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    ownerId: data.ownerId,
    name: data.name,
    address: data.address ?? null,
    phoneNumber: data.phoneNumber ?? null,
    taxId: data.taxId ?? null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}
