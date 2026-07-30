export function attendanceFromFirestore(documentSnapshot) {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    shopId: data.shopId,
    staffId: data.staffId,
    staffName: data.staffName,
    status: data.status,
    note: data.note ?? null,
    markedAt: data.markedAt?.toDate?.() ?? new Date(),
    attendanceDate: data.attendanceDate,
  };
}
