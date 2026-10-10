
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

type StaffRole =
  | 'maitre_d'
  | 'floor_captain'
  | 'sommelier'
  | 'chef'
  | 'kds'
  | 'host';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  zone: string;
  active: boolean;
  pin: string;
  permissions: Record<string, boolean>;
}

interface PermissionItem {
  id: string;
  label: string;
}

interface PermissionGroup {
  title: string;
  icon: string;
  items: PermissionItem[];
}

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './staff-management.component.html',
  styleUrl: './staff-management.component.css'
})
export class StaffManagementComponent {
  searchQuery = '';
  roleFilter = 'all';
  statusFilter = 'all';

  drawerOpen = false;
  isCreating = false;
  toastMessage = '';

  private nextStaffNumber = 18;

  form: StaffMember = this.createEmptyStaff();

  private readonly defaultPermissions: Record<string, boolean> = {
    reservations_view: true,
    reservations_manage: true,
    reservations_cancel: true,
    reservations_capacity: false,
    tables_view: true,
    tables_reassign: true,
    floor_edit: false,
    menu_unavailable: true,
    menu_edit: false,
    beverage_pricing: false,
    staff_create: false,
    staff_permissions: false,
    sales_view: true,
    refunds_manage: false
  };

  permissionGroups: PermissionGroup[] = [
    {
      title: 'Reservations & Bookings',
      icon: 'calendar_month',
      items: [
        { id: 'reservations_view', label: 'View guest reservations and notes' },
        { id: 'reservations_manage', label: 'Confirm, seat, or release bookings' },
        { id: 'reservations_cancel', label: 'Cancel bookings and manage no-shows' },
        { id: 'reservations_capacity', label: 'Override seating capacity' }
      ]
    },
    {
      title: 'Table & Floor Plan',
      icon: 'table_restaurant',
      items: [
        { id: 'tables_view', label: 'View table assignments and sections' },
        { id: 'tables_reassign', label: 'Reassign tables between servers' },
        { id: 'floor_edit', label: 'Modify the floor plan' }
      ]
    },
    {
      title: 'Menu Management',
      icon: 'restaurant_menu',
      items: [
        { id: 'menu_unavailable', label: 'Mark menu items unavailable' },
        { id: 'menu_edit', label: 'Edit dishes, descriptions, and allergens' },
        { id: 'beverage_pricing', label: 'Update beverage pricing' }
      ]
    },
    {
      title: 'Staff & Access',
      icon: 'manage_accounts',
      items: [
        { id: 'staff_create', label: 'Create or deactivate staff accounts' },
        { id: 'staff_permissions', label: 'Change staff permissions' }
      ]
    },
    {
      title: 'Sales & Shift Closing',
      icon: 'receipt_long',
      items: [
        { id: 'sales_view', label: 'View end-of-shift sales summaries' },
        { id: 'refunds_manage', label: 'Manage refunds and tip adjustments' }
      ]
    }
  ];

  roles: { value: StaffRole; label: string }[] = [
    { value: 'maitre_d', label: "Maître D' / Floor Lead" },
    { value: 'floor_captain', label: 'Service Captain' },
    { value: 'sommelier', label: 'Head Sommelier' },
    { value: 'chef', label: 'Sous Chef / Hearth Lead' },
    { value: 'kds', label: 'Kitchen Dispatch' },
    { value: 'host', label: 'Host & Reception' }
  ];

  staff: StaffMember[] = [
    {
      id: 'AUR-STF-001',
      name: 'Chloe Vestergaard',
      email: 'chloe.v@aurelia.example',
      phone: '+60 12-345 6789',
      role: 'maitre_d',
      zone: 'Dining Room & Terrace',
      active: true,
      pin: '',
      permissions: { ...this.defaultPermissions, staff_create: true, staff_permissions: true }
    },
    {
      id: 'AUR-STF-004',
      name: 'Marcus Lind',
      email: 'marcus.l@aurelia.example',
      phone: '+60 12-456 7890',
      role: 'sommelier',
      zone: 'Wine & Beverage Service',
      active: true,
      pin: '',
      permissions: { ...this.defaultPermissions, menu_edit: false }
    },
    {
      id: 'AUR-STF-008',
      name: 'Sofia Chen',
      email: 'sofia.c@aurelia.example',
      phone: '+60 12-567 8901',
      role: 'chef',
      zone: 'Kitchen & Pass',
      active: true,
      pin: '',
      permissions: { ...this.defaultPermissions, tables_reassign: false }
    },
    {
      id: 'AUR-STF-011',
      name: 'Henrik Dahl',
      email: 'henrik.d@aurelia.example',
      phone: '+60 12-678 9012',
      role: 'floor_captain',
      zone: 'Main Dining Room',
      active: true,
      pin: '',
      permissions: { ...this.defaultPermissions, staff_create: false }
    },
    {
      id: 'AUR-STF-014',
      name: 'Astrid Lindholm',
      email: 'astrid.l@aurelia.example',
      phone: '+60 12-789 0123',
      role: 'host',
      zone: 'Reception & Welcome',
      active: false,
      pin: '',
      permissions: { ...this.defaultPermissions, reservations_capacity: false }
    },
    {
      id: 'AUR-STF-017',
      name: 'Kenji Sato',
      email: 'kenji.s@aurelia.example',
      phone: '+60 12-890 1234',
      role: 'kds',
      zone: 'Kitchen Dispatch',
      active: true,
      pin: '',
      permissions: { ...this.defaultPermissions, refunds_manage: false }
    }
  ];

  private createEmptyStaff(): StaffMember {
    return {
      id: '',
      name: '',
      email: '',
      phone: '',
      role: 'floor_captain',
      zone: '',
      active: true,
      pin: '',
      permissions: { ...this.defaultPermissions }
    };
  }

  get filteredStaff(): StaffMember[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.staff.filter(member => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query) ||
        member.zone.toLowerCase().includes(query) ||
        this.roleLabel(member.role).toLowerCase().includes(query);

      const matchesRole =
        this.roleFilter === 'all' || member.role === this.roleFilter;

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && member.active) ||
        (this.statusFilter === 'deactivated' && !member.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  get activeCount(): number {
    return this.staff.filter(member => member.active).length;
  }

  get deactivatedCount(): number {
    return this.staff.filter(member => !member.active).length;
  }

  get roleBreakdown(): { label: string; count: number }[] {
    return this.roles.map(role => ({
      label: role.label,
      count: this.staff.filter(member => member.role === role.value).length
    }));
  }

  get permissionCount(): number {
    return Object.values(this.form.permissions).filter(Boolean).length;
  }

  roleLabel(role: StaffRole): string {
    return this.roles.find(item => item.value === role)?.label ?? role;
  }

  openStaff(member: StaffMember): void {
    this.isCreating = false;
    this.form = {
      ...member,
      permissions: { ...member.permissions }
    };
    this.drawerOpen = true;
  }

  openCreateDrawer(): void {
    this.isCreating = true;
    this.form = this.createEmptyStaff();
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  saveStaff(): void {
    if (!this.form.name.trim() || !this.form.email.trim() || !this.form.zone.trim()) {
      this.showToast('Please complete the required fields.');
      return;
    }

    const emailExists = this.staff.some(member =>
      member.email.toLowerCase() === this.form.email.trim().toLowerCase() &&
      member.id !== this.form.id
    );

    if (emailExists) {
      this.showToast('This email address is already registered.');
      return;
    }

    if (this.isCreating) {
      const newMember: StaffMember = {
        ...this.form,
        id: `AUR-STF-${String(this.nextStaffNumber).padStart(3, '0')}`,
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        zone: this.form.zone.trim(),
        permissions: { ...this.form.permissions }
      };

      this.nextStaffNumber++;
      this.staff = [...this.staff, newMember];
      this.form = { ...newMember, permissions: { ...newMember.permissions } };
      this.isCreating = false;
      this.showToast('Staff account created successfully.');
      return;
    }

    this.staff = this.staff.map(member =>
      member.id === this.form.id
        ? {
            ...this.form,
            name: this.form.name.trim(),
            email: this.form.email.trim(),
            zone: this.form.zone.trim(),
            permissions: { ...this.form.permissions }
          }
        : member
    );

    this.showToast('Staff details and permissions saved.');
  }

  togglePermission(permissionId: string, checked: boolean): void {
    this.form.permissions = {
      ...this.form.permissions,
      [permissionId]: checked
    };
  }

  setAllPermissions(checked: boolean): void {
    const updated = { ...this.form.permissions };

    for (const group of this.permissionGroups) {
      for (const item of group.items) {
        updated[item.id] = checked;
      }
    }

    this.form.permissions = updated;
    this.showToast(checked ? 'All permissions selected.' : 'All permissions cleared.');
  }

  toggleStatus(): void {
    this.form.active = !this.form.active;
  }

  reactivateStaff(member: StaffMember, event: Event): void {
    event.stopPropagation();

    this.staff = this.staff.map(item =>
      item.id === member.id ? { ...item, active: true } : item
    );

    this.showToast(`${member.name} has been reactivated.`);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
  }

  exportCsv(): void {
    const header = ['Staff ID', 'Name', 'Email', 'Phone', 'Role', 'Zone', 'Status'];

    const rows = this.filteredStaff.map(member => [
      member.id,
      member.name,
      member.email,
      member.phone,
      this.roleLabel(member.role),
      member.zone,
      member.active ? 'Active' : 'Deactivated'
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(value =>
        `"${String(value).replace(/"/g, '""')}"`
      ).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'aurelia-staff-directory.csv';
    link.click();

    URL.revokeObjectURL(url);
    this.showToast('Staff directory exported.');
  }

  showAuditLog(): void {
    this.showToast('Audit log will be connected to the backend later.');
  }

  private toastTimeout?: ReturnType<typeof setTimeout>;

  showToast(message: string): void {
    this.toastMessage = message;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }
}
