import { sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
export const records = sqliteTable("records", {
 id: text("id").primaryKey(), owner: text("owner").notNull(), kind: text("kind").notNull(),
 title: text("title").notNull(), area: text("area").notNull(), details: text("details").notNull(),
 date: text("date").notNull(), status: text("status").notNull(), created: text("created").notNull(),
}, t => [index("idx_records_owner_kind").on(t.owner,t.kind)]);
export const households = sqliteTable("households",{id:text("id").primaryKey(),owner:text("owner").notNull(),title:text("title").notNull(),created:text("created").notNull()});
export const householdMembers = sqliteTable("household_members",{id:text("id").primaryKey(),household_id:text("household_id").notNull(),user_id:text("user_id").notNull(),role:text("role").notNull(),name:text("name").notNull(),email:text("email").notNull()},t=>[index("idx_household_members_user").on(t.user_id),uniqueIndex("uq_household_member").on(t.household_id,t.user_id)]);
export const householdProfiles = sqliteTable("household_profiles",{id:text("id").primaryKey(),household_id:text("household_id").notNull(),name:text("name").notNull(),relationship:text("relationship").notNull(),notes:text("notes").notNull(),created:text("created").notNull()});
export const householdItems = sqliteTable("household_items",{id:text("id").primaryKey(),household_id:text("household_id").notNull(),created_by:text("created_by").notNull(),kind:text("kind").notNull(),title:text("title").notNull(),details:text("details").notNull(),date:text("date").notNull(),status:text("status").notNull(),assignee:text("assignee").notNull(),created:text("created").notNull()},t=>[index("idx_household_items_circle").on(t.household_id)]);
export const householdInvites = sqliteTable("household_invites",{id:text("id").primaryKey(),household_id:text("household_id").notNull(),email:text("email").notNull(),role:text("role").notNull(),token_hash:text("token_hash").notNull(),status:text("status").notNull(),expires:text("expires").notNull(),created:text("created").notNull()});
