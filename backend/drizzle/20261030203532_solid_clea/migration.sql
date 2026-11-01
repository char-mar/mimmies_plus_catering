CREATE TABLE "menu_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"menu_id" uuid,
	"variant_id" uuid,
	"url" text NOT NULL,
	"public_id" text NOT NULL,
	"alt_text" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_images_owner_check" CHECK ((
        ("menu_id" IS NOT NULL AND "variant_id" IS NULL)
        OR
        ("menu_id" IS NULL AND "variant_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
ALTER TABLE "menu_images" ADD CONSTRAINT "menu_images_menu_id_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menu_images" ADD CONSTRAINT "menu_images_variant_id_menu_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "menu_variants"("id") ON DELETE CASCADE;