CREATE TYPE "contact_status" AS ENUM('NEW', 'READ', 'REPLIED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"subject" varchar(150) NOT NULL,
	"message" text NOT NULL,
	"status" "contact_status" DEFAULT 'NEW'::"contact_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contacts_status_idx" ON "contacts" ("status");--> statement-breakpoint
CREATE INDEX "contacts_created_at_idx" ON "contacts" ("created_at");