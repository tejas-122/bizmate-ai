import { appState } from '../../app/state.js';
import { formatMoney, includesText } from '../../app/dom.js';

export function staffView() {
  const staff = appState.staff.filter((staffMember) =>
    includesText(staffMember, appState.searchQuery, [
      'fullName',
      'role',
      'email',
      'phoneNumber',
    ]),
  );

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Staff</h2>
          <p class="muted">${staff.length} matching people</p>
        </div>
        <button class="primary-button" type="button" data-action="add-staff">Add staff</button>
      </div>
      ${
        staff.length === 0
          ? '<p class="muted">No staff members have been added yet.</p>'
          : `<div class="list">
              ${staff
                .map(
                  (staffMember) => staffRow(staffMember),
                )
                .join('')}
            </div>`
      }
    </section>
  `;
}

function staffRow(staffMember) {
  const summary = attendanceSummary(staffMember);

  return `
    <article class="list-item payroll-item">
      <div>
        <strong>${staffMember.fullName}</strong>
        <div class="muted">${staffMember.role}</div>
        <small>${staffMember.email ?? staffMember.phoneNumber ?? 'No contact added'}</small>
        <div class="payroll-grid">
          <span>Present <strong>${summary.presentDays}</strong></span>
          <span>Absent <strong>${summary.absentDays}</strong></span>
          <span>Daily <strong>${formatMoney(summary.dailyWage)}</strong></span>
          <span>Salary <strong>${formatMoney(summary.salaryPayable)}</strong></span>
        </div>
      </div>
      <div class="right-stack">
        ${attendancePill(staffMember.id)}
        <div class="row-actions">
          <button
            class="ghost-button compact-button"
            type="button"
            data-attendance="present"
            data-staff-id="${staffMember.id}"
          >
            Present
          </button>
          <button
            class="ghost-button compact-button"
            type="button"
            data-attendance="absent"
            data-staff-id="${staffMember.id}"
          >
            Absent
          </button>
          <button
            class="danger-button compact-button"
            type="button"
            data-remove-record="staff"
            data-record-id="${staffMember.id}"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  `;
}

function attendanceSummary(staffMember) {
  const recordsByDay = new Map();
  appState.attendance
    .filter((item) => item.staffId === staffMember.id)
    .forEach((item) => {
      recordsByDay.set(item.attendanceDate, item.status);
    });

  const statuses = [...recordsByDay.values()];
  const presentDays = statuses.filter((status) => status === 'present').length;
  const absentDays = statuses.filter((status) => status === 'absent').length;
  const dailyWage = Number(staffMember.dailyWage ?? 0);

  return {
    presentDays,
    absentDays,
    dailyWage,
    salaryPayable: presentDays * dailyWage,
  };
}

function attendancePill(staffId) {
  const today = new Date().toISOString().slice(0, 10);
  const attendance = appState.attendance.find(
    (item) => item.staffId === staffId && item.attendanceDate === today,
  );

  if (!attendance) {
    return '<span class="pill">Not marked</span>';
  }

  return `
    <span class="pill ${attendance.status === 'present' ? 'success-pill' : 'danger-pill'}">
      ${attendance.status === 'present' ? 'Present today' : 'Absent today'}
    </span>
  `;
}
