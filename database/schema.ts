import {
  varchar,
  uuid,
  integer,
  text,
  boolean,
  pgTable,
  date,
  pgEnum,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";

export const STATUS_ENUM = pgEnum("status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const ROLE_ENUM = pgEnum("role", ["USER", "ADMIN", "MANAGER", "STAFF"]);
export const BORROW_STATUS_ENUM = pgEnum("borrow_status", [
  "BORROWED",
  "RETURNED",
]);

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  status: STATUS_ENUM("status").default("PENDING"),
  role: ROLE_ENUM("role").default("USER"),
  lastActivityDate: date("last_activity_date").defaultNow(),
  createdAt: timestamp("created-at", {
    withTimezone: true,
  }).defaultNow(),
});

export const books = pgTable("books", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  genre: text("genre").notNull(),
  rating: integer("rating").notNull(),
  coverUrl: text("cover_url").notNull(),
  coverColor: varchar("cover_color", { length: 7 }).notNull(),
  description: text("description").notNull(),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(0),
  videoUrl: text("video_url").notNull(),
  summary: varchar("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const borrowRecords = pgTable("borrow_records", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id)
    .notNull(),
  borrowDate: timestamp("borrow_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: BORROW_STATUS_ENUM("status").default("BORROWED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),

  email: text("email").notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  mobileNumber: varchar("mobile_number", { length: 20 }).notNull(),

  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: varchar("appointment_time", { length: 10 }).notNull(), // e.g., "14:00"

  branch: varchar("branch", { length: 100 }).notNull(),
  barber: varchar("barber", { length: 100 }).notNull(),
  services: text("services").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Inventory Management Tables
export const inventoryItems = pgTable("inventory_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  reorderThreshold: integer("reorder_threshold").notNull().default(10),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  supplier: text("supplier").notNull(),
  expirationDate: timestamp("expiration_date"),
  status: text("status", { enum: ["in-stock", "low-stock", "out-of-stock"] })
    .notNull()
    .default("in-stock"),
  branch: text("branch").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockTransactions = pgTable("stock_transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItems.id),
  type: text("type", { enum: ["in", "out"] }).notNull(),
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  notes: text("notes"),
  reason: text("reason").notNull(),
  branch: text("branch").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderNumber: text("order_number").notNull().unique(),
  supplier: text("supplier").notNull(),
  status: text("status", {
    enum: ["requested", "ordered", "received", "cancelled"],
  })
    .notNull()
    .default("requested"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => users.id),
  requestedDate: timestamp("requested_date").defaultNow(),
  orderedDate: timestamp("ordered_date"),
  receivedDate: timestamp("received_date"),
  notes: text("notes"),
  branch: text("branch").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItems.id),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryCategories = pgTable("inventory_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryBranches = pgTable("inventory_branches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  hours: text("hours"), // Added hours field for operating hours
  managerId: text("manager_id"), // Removed foreign key constraint to avoid complications
  createdAt: timestamp("created_at").defaultNow(),
});

export const barbers = pgTable("barbers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  specialties: text("specialties").notNull(), // JSON string of specialties array
  experience: text("experience").notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull(),
  image: text("image"),
  branches: text("branches").notNull(), // JSON string of branch IDs array
  createdAt: timestamp("created_at").defaultNow(),
});

// Services Catalog (migrated from public/services.json)
export const servicesCatalog = pgTable("services_catalog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff Scheduling Tables
export const shiftTypesEnum = pgEnum("shift_type", ["full", "half", "split"]);
export const leaveTypesEnum = pgEnum("leave_type", ["vacation", "sick", "unpaid", "other"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "denied"]);

export const staffShifts = pgTable("staff_shifts", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  barberId: text("barber_id").notNull(),
  branchId: text("branch_id").notNull(),
  date: date("date").notNull(), // YYYY-MM-DD
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:mm
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:mm
  breaks: text("breaks"), // JSON string of breaks array
  type: shiftTypesEnum("type").default("full").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const staffLeaves = pgTable("staff_leaves", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  barberId: text("barber_id").notNull(),
  type: leaveTypesEnum("type").notNull(),
  date: date("date").notNull(), // YYYY-MM-DD
  startTime: varchar("start_time", { length: 5 }), // HH:mm, optional for full day leaves
  endTime: varchar("end_time", { length: 5 }), // HH:mm, optional for full day leaves
  status: leaveStatusEnum("status").default("pending").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const shiftTemplates = pgTable("shift_templates", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:mm
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:mm
  breakStart: varchar("break_start", { length: 5 }), // HH:mm, optional
  breakEnd: varchar("break_end", { length: 5 }), // HH:mm, optional
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Transaction Verification Tables
export const VERIFICATION_STATUS_ENUM = pgEnum("verification_status", [
  "pending",
  "verified", 
  "rejected"
]);

export const transactionVerifications = pgTable("transaction_verifications", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  transactionId: text("transaction_id").notNull(), // References sales.id
  status: VERIFICATION_STATUS_ENUM("status").default("pending").notNull(),
  verifiedBy: text("verified_by"), // admin user ID/name
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  transactionIdIdx: index("transaction_verifications_transaction_id_idx").on(table.transactionId),
  statusIdx: index("transaction_verifications_status_idx").on(table.status),
  verifiedAtIdx: index("transaction_verifications_verified_at_idx").on(table.verifiedAt),
}));
