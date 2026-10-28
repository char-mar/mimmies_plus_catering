CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(50) NOT NULL UNIQUE,
	"slug" varchar(120) NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "menu_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"menu_id" uuid NOT NULL,
	"size" text,
	"price" numeric(10,2) NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_index" ON "categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_index" ON "categories" ("slug");--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "menu_variants" ADD CONSTRAINT "menu_variants_menu_id_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE;